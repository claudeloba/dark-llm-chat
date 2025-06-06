
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput, type UpdateConversationInput } from '../schema';
import { updateConversation } from '../handlers/update_conversation';
import { eq } from 'drizzle-orm';

// Test data
const createInput: CreateConversationInput = {
  title: 'Original Title',
  mode: 'smart_answer'
};

const updateInput: UpdateConversationInput = {
  id: 1,
  title: 'Updated Title'
};

describe('updateConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a conversation title', async () => {
    // Create a conversation first
    const created = await db.insert(conversationsTable)
      .values({
        title: createInput.title,
        mode: createInput.mode
      })
      .returning()
      .execute();

    const conversationId = created[0].id;

    // Update the conversation
    const result = await updateConversation({
      id: conversationId,
      title: 'Updated Title'
    });

    // Verify updated fields
    expect(result.id).toEqual(conversationId);
    expect(result.title).toEqual('Updated Title');
    expect(result.mode).toEqual('smart_answer');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should save updated conversation to database', async () => {
    // Create a conversation first
    const created = await db.insert(conversationsTable)
      .values({
        title: createInput.title,
        mode: createInput.mode
      })
      .returning()
      .execute();

    const conversationId = created[0].id;

    // Update the conversation
    await updateConversation({
      id: conversationId,
      title: 'Updated Title'
    });

    // Verify database was updated
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversationId))
      .execute();

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title).toEqual('Updated Title');
    expect(conversations[0].mode).toEqual('smart_answer');
    expect(conversations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent conversation', async () => {
    await expect(updateConversation({
      id: 999,
      title: 'Updated Title'
    })).rejects.toThrow(/not found/i);
  });

  it('should update only updated_at when no title provided', async () => {
    // Create a conversation first
    const created = await db.insert(conversationsTable)
      .values({
        title: createInput.title,
        mode: createInput.mode
      })
      .returning()
      .execute();

    const conversationId = created[0].id;
    const originalUpdatedAt = created[0].updated_at;

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update without title
    const result = await updateConversation({
      id: conversationId
    });

    // Verify only updated_at changed
    expect(result.title).toEqual('Original Title');
    expect(result.mode).toEqual('smart_answer');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
