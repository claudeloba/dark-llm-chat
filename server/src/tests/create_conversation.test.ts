
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { createConversation } from '../handlers/create_conversation';
import { eq } from 'drizzle-orm';

const testInput: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'smart_answer'
};

describe('createConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a conversation', async () => {
    const result = await createConversation(testInput);

    expect(result.title).toEqual('Test Conversation');
    expect(result.mode).toEqual('smart_answer');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save conversation to database', async () => {
    const result = await createConversation(testInput);

    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, result.id))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toEqual('Test Conversation');
    expect(conversations[0].mode).toEqual('smart_answer');
    expect(conversations[0].created_at).toBeInstanceOf(Date);
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create conversation with different modes', async () => {
    const groupChatInput: CreateConversationInput = {
      title: 'Group Chat Test',
      mode: 'group_chat'
    };

    const result = await createConversation(groupChatInput);

    expect(result.title).toEqual('Group Chat Test');
    expect(result.mode).toEqual('group_chat');
    expect(result.id).toBeDefined();
  });

  it('should create conversation with autopilot mode', async () => {
    const autopilotInput: CreateConversationInput = {
      title: 'Autopilot Test',
      mode: 'autopilot'
    };

    const result = await createConversation(autopilotInput);

    expect(result.title).toEqual('Autopilot Test');
    expect(result.mode).toEqual('autopilot');
    expect(result.id).toBeDefined();
  });
});
