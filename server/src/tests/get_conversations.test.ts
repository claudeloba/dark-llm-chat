
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput } from '../schema';
import { getConversations } from '../handlers/get_conversations';

// Test data
const testConversation1: CreateConversationInput = {
  title: 'First Conversation',
  mode: 'smart_answer'
};

const testConversation2: CreateConversationInput = {
  title: 'Second Conversation',
  mode: 'group_chat'
};

const testConversation3: CreateConversationInput = {
  title: 'Third Conversation',
  mode: 'autopilot'
};

describe('getConversations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no conversations exist', async () => {
    const result = await getConversations();
    expect(result).toEqual([]);
  });

  it('should return all conversations', async () => {
    // Create test conversations
    await db.insert(conversationsTable).values([
      testConversation1,
      testConversation2,
      testConversation3
    ]).execute();

    const result = await getConversations();

    expect(result).toHaveLength(3);
    expect(result.map(c => c.title)).toContain('First Conversation');
    expect(result.map(c => c.title)).toContain('Second Conversation');
    expect(result.map(c => c.title)).toContain('Third Conversation');
  });

  it('should return conversations with correct properties', async () => {
    await db.insert(conversationsTable).values(testConversation1).execute();

    const result = await getConversations();

    expect(result).toHaveLength(1);
    const conversation = result[0];
    expect(conversation.id).toBeDefined();
    expect(conversation.title).toEqual('First Conversation');
    expect(conversation.mode).toEqual('smart_answer');
    expect(conversation.created_at).toBeInstanceOf(Date);
    expect(conversation.updated_at).toBeInstanceOf(Date);
  });

  it('should return conversations ordered by updated_at descending', async () => {
    // Insert conversations with small delay to ensure different timestamps
    await db.insert(conversationsTable).values(testConversation1).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(conversationsTable).values(testConversation2).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(conversationsTable).values(testConversation3).execute();

    const result = await getConversations();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recently updated should be first
    expect(result[0].title).toEqual('Third Conversation');
    expect(result[1].title).toEqual('Second Conversation');
    expect(result[2].title).toEqual('First Conversation');
    
    // Verify timestamps are in descending order
    expect(result[0].updated_at.getTime()).toBeGreaterThanOrEqual(result[1].updated_at.getTime());
    expect(result[1].updated_at.getTime()).toBeGreaterThanOrEqual(result[2].updated_at.getTime());
  });

  it('should handle different chat modes correctly', async () => {
    const conversations = [
      { title: 'Smart Answer Chat', mode: 'smart_answer' as const },
      { title: 'Group Chat', mode: 'group_chat' as const },
      { title: 'Autopilot Chat', mode: 'autopilot' as const }
    ];

    await db.insert(conversationsTable).values(conversations).execute();

    const result = await getConversations();

    expect(result).toHaveLength(3);
    
    const modes = result.map(c => c.mode);
    expect(modes).toContain('smart_answer');
    expect(modes).toContain('group_chat');
    expect(modes).toContain('autopilot');
  });
});
