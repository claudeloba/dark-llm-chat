
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, messagesTable, participantsTable } from '../db/schema';
import { type CreateMessageInput } from '../schema';
import { createMessage } from '../handlers/create_message';
import { eq } from 'drizzle-orm';

describe('createMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let conversationId: number;
  let participantId: number;

  beforeEach(async () => {
    // Create prerequisite conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        title: 'Test Conversation',
        mode: 'smart_answer'
      })
      .returning()
      .execute();
    conversationId = conversationResult[0].id;

    // Create prerequisite participant
    const participantResult = await db.insert(participantsTable)
      .values({
        conversation_id: conversationId,
        name: 'Test Assistant',
        role: 'assistant',
        ai_model: 'chatgpt'
      })
      .returning()
      .execute();
    participantId = participantResult[0].id;
  });

  it('should create a message with required fields only', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: conversationId,
      role: 'user',
      content: 'Hello, this is a test message'
    };

    const result = await createMessage(testInput);

    expect(result.conversation_id).toEqual(conversationId);
    expect(result.role).toEqual('user');
    expect(result.content).toEqual('Hello, this is a test message');
    expect(result.ai_model).toBeNull();
    expect(result.participant_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a message with all optional fields', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: conversationId,
      role: 'assistant',
      content: 'This is an AI response',
      ai_model: 'chatgpt',
      participant_id: participantId
    };

    const result = await createMessage(testInput);

    expect(result.conversation_id).toEqual(conversationId);
    expect(result.role).toEqual('assistant');
    expect(result.content).toEqual('This is an AI response');
    expect(result.ai_model).toEqual('chatgpt');
    expect(result.participant_id).toEqual(participantId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    const testInput: CreateMessageInput = {
      conversation_id: conversationId,
      role: 'system',
      content: 'System message for testing'
    };

    const result = await createMessage(testInput);

    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].conversation_id).toEqual(conversationId);
    expect(messages[0].role).toEqual('system');
    expect(messages[0].content).toEqual('System message for testing');
    expect(messages[0].ai_model).toBeNull();
    expect(messages[0].participant_id).toBeNull();
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different AI models', async () => {
    const testInputs = [
      { ai_model: 'gemini' as const },
      { ai_model: 'deepseek' as const },
      { ai_model: 'grok' as const }
    ];

    for (const aiModel of testInputs) {
      const testInput: CreateMessageInput = {
        conversation_id: conversationId,
        role: 'assistant',
        content: `Message from ${aiModel.ai_model}`,
        ai_model: aiModel.ai_model
      };

      const result = await createMessage(testInput);
      expect(result.ai_model).toEqual(aiModel.ai_model);
    }
  });

  it('should handle different message roles', async () => {
    const roles = ['user', 'assistant', 'system'] as const;

    for (const role of roles) {
      const testInput: CreateMessageInput = {
        conversation_id: conversationId,
        role: role,
        content: `Message from ${role}`
      };

      const result = await createMessage(testInput);
      expect(result.role).toEqual(role);
    }
  });
});
