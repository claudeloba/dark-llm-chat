
import { db } from '../db';
import { conversationsTable } from '../db/schema';
import { type CreateConversationInput, type Conversation } from '../schema';

export const createConversation = async (input: CreateConversationInput): Promise<Conversation> => {
  try {
    const result = await db.insert(conversationsTable)
      .values({
        title: input.title,
        mode: input.mode
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Conversation creation failed:', error);
    throw error;
  }
};
