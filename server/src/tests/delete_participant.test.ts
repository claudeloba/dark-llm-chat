
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, participantsTable } from '../db/schema';
import { type CreateConversationInput, type CreateParticipantInput, type DeleteParticipantInput } from '../schema';
import { deleteParticipant } from '../handlers/delete_participant';
import { eq } from 'drizzle-orm';

// Test inputs
const testConversation: CreateConversationInput = {
  title: 'Test Conversation',
  mode: 'group_chat'
};

const testParticipant: CreateParticipantInput = {
  conversation_id: 1,
  name: 'Test Participant',
  description: 'A participant for testing',
  role: 'expert',
  avatar_url: null,
  ai_model: 'chatgpt',
  is_active: true
};

describe('deleteParticipant', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a participant', async () => {
    // Create prerequisite conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create participant to delete
    const participantResult = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversationResult[0].id
      })
      .returning()
      .execute();

    const deleteInput: DeleteParticipantInput = {
      id: participantResult[0].id
    };

    // Delete the participant
    await deleteParticipant(deleteInput);

    // Verify participant was deleted
    const participants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participantResult[0].id))
      .execute();

    expect(participants).toHaveLength(0);
  });

  it('should not throw error when deleting non-existent participant', async () => {
    const deleteInput: DeleteParticipantInput = {
      id: 99999
    };

    // Should not throw error even if participant doesn't exist
    await expect(deleteParticipant(deleteInput)).resolves.toBeUndefined();
  });

  it('should delete participant without affecting other participants', async () => {
    // Create prerequisite conversation
    const conversationResult = await db.insert(conversationsTable)
      .values(testConversation)
      .returning()
      .execute();

    // Create two participants
    const participant1Result = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversationResult[0].id,
        name: 'Participant 1'
      })
      .returning()
      .execute();

    const participant2Result = await db.insert(participantsTable)
      .values({
        ...testParticipant,
        conversation_id: conversationResult[0].id,
        name: 'Participant 2'
      })
      .returning()
      .execute();

    const deleteInput: DeleteParticipantInput = {
      id: participant1Result[0].id
    };

    // Delete first participant
    await deleteParticipant(deleteInput);

    // Verify first participant was deleted
    const deletedParticipants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participant1Result[0].id))
      .execute();

    expect(deletedParticipants).toHaveLength(0);

    // Verify second participant still exists
    const remainingParticipants = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.id, participant2Result[0].id))
      .execute();

    expect(remainingParticipants).toHaveLength(1);
    expect(remainingParticipants[0].name).toEqual('Participant 2');
  });
});
