
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, participantsTable } from '../db/schema';
import { type UpdateParticipantInput, type CreateConversationInput, type CreateParticipantInput } from '../schema';
import { updateParticipant } from '../handlers/update_participant';
import { eq } from 'drizzle-orm';

// Test data
const testConversation: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'group_chat'
};

const testParticipant: CreateParticipantInput = {
  conversation_id: 1,
  name: 'Test Participant',
  description: 'A test participant',
  role: 'user',
  avatar_url: 'https://example.com/avatar.jpg',
  ai_model: 'chatgpt',
  is_active: true
};

describe('updateParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a participant with all fields', async () => {
    // Create prerequisite conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create participant to update
    const [participant] = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversation.id
      })
      .returning()
      .execute();

    // Update participant
    const updateInput: UpdateParticipantInput = {
      id: participant.id,
      name: 'Updated Participant',
      description: 'Updated description',
      role: 'moderator',
      avatar_url: 'https://example.com/new-avatar.jpg',
      ai_model: 'gemini',
      is_active: false
    };

    const result = await updateParticipant(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(participant.id);
    expect(result.name).toEqual('Updated Participant');
    expect(result.description).toEqual('Updated description');
    expect(result.role).toEqual('moderator');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.ai_model).toEqual('gemini');
    expect(result.is_active).toEqual(false);
    expect(result.conversation_id).toEqual(conversation.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create participant to update
    const [participant] = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversation.id
      })
      .returning()
      .execute();

    // Update only name and role
    const updateInput: UpdateParticipantInput = {
      id: participant.id,
      name: 'Updated Name Only',
      role: 'expert'
    };

    const result = await updateParticipant(updateInput);

    // Verify updated fields
    expect(result.name).toEqual('Updated Name Only');
    expect(result.role).toEqual('expert');
    
    // Verify unchanged fields remain the same
    expect(result.description).toEqual('A test participant');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.ai_model).toEqual('chatgpt');
    expect(result.is_active).toEqual(true);
  });

  it('should update participant to have null values', async () => {
    // Create prerequisite conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create participant to update
    const [participant] = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversation.id
      })
      .returning()
      .execute();

    // Update with null values
    const updateInput: UpdateParticipantInput = {
      id: participant.id,
      description: null,
      avatar_url: null,
      ai_model: null
    };

    const result = await updateParticipant(updateInput);

    // Verify null fields
    expect(result.description).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.ai_model).toBeNull();
    
    // Verify unchanged fields
    expect(result.name).toEqual('Test Participant');
    expect(result.role).toEqual('user');
    expect(result.is_active).toEqual(true);
  });

  it('should persist changes to database', async () => {
    // Create prerequisite conversation
    const [conversation] = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create participant to update
    const [participant] = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversation.id
      })
      .returning()
      .execute();

    // Update participant
    const updateInput: UpdateParticipantInput = {
      id: participant.id,
      name: 'Persisted Name',
      is_active: false
    };

    await updateParticipant(updateInput);

    // Query database to verify persistence
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participant.id))
      .execute();

    expect(participants).toHaveLength(1);
    expect(participants[0].name).toEqual('Persisted Name');
    expect(participants[0].is_active).toEqual(false);
  });

  it('should throw error for non-existent participant', async () => {
    const updateInput: UpdateParticipantInput = {
      id: 999,
      name: 'Non-existent'
    };

    await expect(updateParticipant(updateInput)).rejects.toThrow(/not found/i);
  });
});
