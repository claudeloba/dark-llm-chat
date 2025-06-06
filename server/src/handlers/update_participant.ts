
import { db } from '../db';
import { participantsTable } from '../db/schema';
import { type UpdateParticipantInput, type Participant } from '../schema';
import { eq } from 'drizzle-orm';

export const updateParticipant = async (input: UpdateParticipantInput): Promise<Participant> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof participantsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.role !== undefined) {
      updateData.role = input.role;
    }
    
    if (input.avatar_url !== undefined) {
      updateData.avatar_url = input.avatar_url;
    }
    
    if (input.ai_model !== undefined) {
      updateData.ai_model = input.ai_model;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update participant record
    const result = await db.update(participantsTable)
      .set(updateData)
      .where(eq(participantsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Participant with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Participant update failed:', error);
    throw error;
  }
};
