
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, messagesTable } from '../db/schema';
import { type CreateConversationInput, type CreateMessageInput, type GetMessagesInput } from '../schema';
import { getMessages } from '../handlers/get_messages';

// Test data
const testConversation: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'smart_answer'
};

const createTestMessage = (conversationId: number, content: string): CreateMessageInput => ({
  conversation_id: conversationId,
  role: 'user',
  content,
  ai_model: 'chatgpt',
  participant_id: null
});

// Helper function to create messages with distinct timestamps
const createMessagesWithDelay = async (conversationId: number, messages: string[]) => {
  for (let i = 0; i < messages.length; i++) {
    await db.insert(messagesTable).values(createTestMessage(conversationId, messages[i])).execute();
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get messages for a conversation', async () => {
    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversationId = conversationResult[0].id;

    // Create test messages with delays to ensure proper ordering
    await createMessagesWithDelay(conversationId, ['First message', 'Second message', 'Third message']);

    const input: GetMessagesInput = {
      conversation_id: conversationId
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(3);
    // Messages should be ordered by created_at desc (newest first)
    expect(result[0].content).toEqual('Third message');
    expect(result[1].content).toEqual('Second message');
    expect(result[2].content).toEqual('First message');

    // Verify message properties
    result.forEach(message => {
      expect(message.id).toBeDefined();
      expect(message.conversation_id).toEqual(conversationId);
      expect(message.role).toEqual('user');
      expect(message.ai_model).toEqual('chatgpt');
      expect(message.participant_id).toBeNull();
      expect(message.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for conversation with no messages', async () => {
    // Create conversation without messages
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversationId = conversationResult[0].id;

    const input: GetMessagesInput = {
      conversation_id: conversationId
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(0);
  });

  it('should apply limit correctly', async () => {
    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversationId = conversationResult[0].id;

    // Create 5 test messages with delays
    const messageContents = Array.from({ length: 5 }, (_, i) => `Message ${i + 1}`);
    await createMessagesWithDelay(conversationId, messageContents);

    const input: GetMessagesInput = {
      conversation_id: conversationId,
      limit: 3
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(3);
    // Should get the 3 newest messages
    expect(result[0].content).toEqual('Message 5');
    expect(result[1].content).toEqual('Message 4');
    expect(result[2].content).toEqual('Message 3');
  });

  it('should apply offset correctly', async () => {
    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversationId = conversationResult[0].id;

    // Create 5 test messages with delays
    const messageContents = Array.from({ length: 5 }, (_, i) => `Message ${i + 1}`);
    await createMessagesWithDelay(conversationId, messageContents);

    const input: GetMessagesInput = {
      conversation_id: conversationId,
      offset: 2
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(3);
    // Should skip the 2 newest messages
    expect(result[0].content).toEqual('Message 3');
    expect(result[1].content).toEqual('Message 2');
    expect(result[2].content).toEqual('Message 1');
  });

  it('should apply both limit and offset correctly', async () => {
    // Create conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversationId = conversationResult[0].id;

    // Create 10 test messages with delays
    const messageContents = Array.from({ length: 10 }, (_, i) => `Message ${i + 1}`);
    await createMessagesWithDelay(conversationId, messageContents);

    const input: GetMessagesInput = {
      conversation_id: conversationId,
      limit: 3,
      offset: 2
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(3);
    // Should skip 2 newest, then take 3
    expect(result[0].content).toEqual('Message 8');
    expect(result[1].content).toEqual('Message 7');
    expect(result[2].content).toEqual('Message 6');
  });

  it('should only return messages for specified conversation', async () => {
    // Create two conversations
    const conversation1Result = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();
    const conversation1Id = conversation1Result[0].id;

    const conversation2Result = await db.insert(conversationsTable)
      .values({ ...testConversation, title: 'Second Conversation' })
      .returning()
      .execute();
    const conversation2Id = conversation2Result[0].id;

    // Add messages to both conversations with delays
    await createMessagesWithDelay(conversation1Id, ['Conv1 Message 1', 'Conv1 Message 2']);
    await createMessagesWithDelay(conversation2Id, ['Conv2 Message 1', 'Conv2 Message 2']);

    const input: GetMessagesInput = {
      conversation_id: conversation1Id
    };

    const result = await getMessages(input);

    expect(result).toHaveLength(2);
    result.forEach(message => {
      expect(message.conversation_id).toEqual(conversation1Id);
      expect(message.content).toMatch(/^Conv1/);
    });
  });
});
