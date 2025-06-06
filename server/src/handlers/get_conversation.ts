
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type GetConversationInput, type Conversation } from '../schema';
import { eq } from 'drizzle-orm';

export const getConversation = async (input: GetConversationInput): Promise<Conversation | null> => {
  try {
    const result = await db.select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Get conversation failed:', error);
    throw error;
  }
};
