
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type UpdateConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const updateConversation = async (input: UpdateConversationInput): Promise<Conversation> => {
  try {
    // Build update values - only include provided fields
    const updateValues: { title?: string; updated_at: Date } = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateValues.title = input.title;
    }

    // Update conversation record
    const result = await db.update(conversationsTable)
      .set(updateValues)
      .where(eq(conversationsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Conversation with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Conversation update failed:', error);
    throw error;
  }
};
