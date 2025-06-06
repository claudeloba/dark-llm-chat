
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type GetParticipantsInput, type Participant } from '../schema';
import { eq } from 'drizzle-orm';

export const getParticipants = async (input: GetParticipantsInput): Promise<Participant[]> => {
  try {
    const results = await db.select()
      .from(participantsTable)
      .where(eq(participantsTable.conversation_id, input.conversation_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Get participants failed:', error);
    throw error;
  }
};
