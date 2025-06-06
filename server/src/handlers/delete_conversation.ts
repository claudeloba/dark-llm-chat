
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type DeleteConversationInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteConversation = async (input: DeleteConversationInput): Promise<void> => {
  try {
    await db.delete(conversationsTable)
      .where(eq(conversationsTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Conversation deletion failed:', error);
    throw error;
  }
};
