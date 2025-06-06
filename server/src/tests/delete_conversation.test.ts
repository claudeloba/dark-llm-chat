
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, messagesTable, participantsTable } from '../db/schema';
import { type DeleteConversationInput, type CreateConversationInput, type CreateMessageInput, type CreateParticipantInput } from '../schema';
import { deleteConversation } from '../handlers/delete_conversation';
import { eq } from 'drizzle-orm';

const testConversation: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'smart_answer'
};

const testDeleteInput: DeleteConversationInput = {
  id: 1
};

describe('deleteConversation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a conversation', async () => {
    // Create test conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Delete the conversation
    await deleteConversation({ id: conversation.id });

    // Verify conversation is deleted
    const conversations = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, conversation.id))
      .execute();

    expect(conversations).toHaveLength(0);
  });

  it('should cascade delete related messages', async () => {
    // Create test conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create test message
    const messageInput: CreateMessageInput = {
      conversation_id: conversation.id,
      role: 'user',
      content: 'Test message',
      ai_model: null,
      participant_id: null
    };

    await db.insert(messagesTable)
      .values(messageInput)
      .execute();

    // Delete the conversation
    await deleteConversation({ id: conversation.id });

    // Verify related messages are deleted
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, conversation.id))
      .execute();

    expect(messages).toHaveLength(0);
  });

  it('should cascade delete related participants', async () => {
    // Create test conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create test participant
    const participantInput: CreateParticipantInput = {
      conversation_id: conversation.id,
      name: 'Test Participant',
      description: 'A test participant',
      role: 'user',
      avatar_url: null,
      ai_model: null,
      is_active: true
    };

    await db.insert(participantsTable)
      .values(participantInput)
      .execute();

    // Delete the conversation
    await deleteConversation({ id: conversation.id });

    // Verify related participants are deleted
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.conversation_id, conversation.id))
      .execute();

    expect(participants).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent conversation', async () => {
    // Should not throw when deleting non-existent conversation
    await expect(async () => {
      await deleteConversation({ id: 9999 });
    }).not.toThrow();
  });
});
