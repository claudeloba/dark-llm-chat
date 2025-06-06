
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type GetConversationInput, type CreateConversationInput } from '../schema';
import { getConversation } from '../handlers/get_conversation';

const testConversationInput: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'smart_answer'
};

describe('getConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get conversation by id', async () => {
    // Create a conversation first
    const insertResult = await db.insert(conversationsTable)
      .values({
        title: testConversationInput.title,
        mode: testConversationInput.mode
      })
      .returning()
      .execute();

    const createdConversation = insertResult[0];

    // Test the handler
    const input: GetConversationInput = {
      id: createdConversation.id
    };

    const result = await getConversation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdConversation.id);
    expect(result!.title).toBe('Test Conversation');
    expect(result!.mode).toBe('smart_answer');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent conversation', async () => {
    const input: GetConversationInput = {
      id: 999999
    };

    const result = await getConversation(input);

    expect(result).toBeNull();
  });

  it('should return the correct conversation when multiple exist', async () => {
    // Create multiple conversations
    const conversation1 = await db.insert(conversationsTable)
      .values({
        title: 'First Conversation',
        mode: 'smart_answer'
      })
      .returning()
      .execute();

    const conversation2 = await db.insert(conversationsTable)
      .values({
        title: 'Second Conversation',
        mode: 'group_chat'
      })
      .returning()
      .execute();

    // Get the second conversation
    const input: GetConversationInput = {
      id: conversation2[0].id
    };

    const result = await getConversation(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(conversation2[0].id);
    expect(result!.title).toBe('Second Conversation');
    expect(result!.mode).toBe('group_chat');
  });
});
