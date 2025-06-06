
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type DeleteParticipantInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteParticipant = async (input: DeleteParticipantInput): Promise<void> => {
  try {
    await db.delete(participantsTable)
      .where(eq(participantsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Participant deletion failed:', error);
    throw error;
  }
};
