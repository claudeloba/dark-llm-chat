
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type CreateParticipantInput, type Participant } from '../schema';

export const createParticipant = async (input: CreateParticipantInput): Promise<Participant> => {
  try {
    const result = await db.insert(participantsTable)
      .values({
        conversation_id: input.conversation_id,
        name: input.name,
        description: input.description || null,
        role: input.role,
        avatar_url: input.avatar_url || null,
        ai_model: input.ai_model || null,
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Participant creation failed:', error);
    throw error;
  }
};
