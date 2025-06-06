
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, participantsTable } from '../db/schema';
import { type CreateParticipantInput } from '../schema';
import { createParticipant } from '../handlers/create_participant';
import { eq } from 'drizzle-orm';

// Helper to create a test conversation
const createTestConversation = async () => {
  const result = await db.insert(conversationsTable)
    .values({
      title: 'Test Conversation',
      mode: 'smart_answer'
    })
    .returning()
    .execute();
  return result[0];
};

describe('createParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a participant with all fields', async () => {
    const conversation = await createTestConversation();
    
    const testInput: CreateParticipantInput = {
      conversation_id: conversation.id,
      name: 'Test Expert',
      description: 'AI expert participant',
      role: 'expert',
      avatar_url: 'https://example.com/avatar.png',
      ai_model: 'chatgpt',
      is_active: true
    };

    const result = await createParticipant(testInput);

    expect(result.conversation_id).toEqual(conversation.id);
    expect(result.name).toEqual('Test Expert');
    expect(result.description).toEqual('AI expert participant');
    expect(result.role).toEqual('expert');
    expect(result.avatar_url).toEqual('https://example.com/avatar.png');
    expect(result.ai_model).toEqual('chatgpt');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a participant with minimal fields', async () => {
    const conversation = await createTestConversation();
    
    const testInput: CreateParticipantInput = {
      conversation_id: conversation.id,
      name: 'Simple Assistant',
      role: 'assistant'
    };

    const result = await createParticipant(testInput);

    expect(result.conversation_id).toEqual(conversation.id);
    expect(result.name).toEqual('Simple Assistant');
    expect(result.description).toBeNull();
    expect(result.role).toEqual('assistant');
    expect(result.avatar_url).toBeNull();
    expect(result.ai_model).toBeNull();
    expect(result.is_active).toEqual(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save participant to database', async () => {
    const conversation = await createTestConversation();
    
    const testInput: CreateParticipantInput = {
      conversation_id: conversation.id,
      name: 'Database Test',
      role: 'moderator',
      is_active: false
    };

    const result = await createParticipant(testInput);

    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, result.id))
      .execute();

    expect(participants).toHaveLength(1);
    expect(participants[0].name).toEqual('Database Test');
    expect(participants[0].role).toEqual('moderator');
    expect(participants[0].is_active).toEqual(false);
    expect(participants[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle null description and avatar_url correctly', async () => {
    const conversation = await createTestConversation();
    
    const testInput: CreateParticipantInput = {
      conversation_id: conversation.id,
      name: 'Null Test',
      description: null,
      role: 'analyst',
      avatar_url: null
    };

    const result = await createParticipant(testInput);

    expect(result.description).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.ai_model).toBeNull();
  });

  it('should throw error for non-existent conversation', async () => {
    const testInput: CreateParticipantInput = {
      conversation_id: 999999, // Non-existent conversation
      name: 'Invalid Test',
      role: 'user'
    };

    expect(createParticipant(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
