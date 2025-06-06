
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type GetMessagesInput, type Message } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getMessages = async (input: GetMessagesInput): Promise<Message[]> => {
  try {
    // Build base query
    let baseQuery = db.select()
      .from(messagesTable)
      .where(eq(messagesTable.conversation_id, input.conversation_id))
      .orderBy(desc(messagesTable.created_at));

    // Apply pagination in a single chain
    if (input.limit !== undefined && input.offset !== undefined) {
      const results = await baseQuery.limit(input.limit).offset(input.offset).execute();
      return results;
    } else if (input.limit !== undefined) {
      const results = await baseQuery.limit(input.limit).execute();
      return results;
    } else if (input.offset !== undefined) {
      const results = await baseQuery.offset(input.offset).execute();
      return results;
    } else {
      const results = await baseQuery.execute();
      return results;
    }
  } catch (error) {
    console.error('Get messages failed:', error);
    throw error;
  }
};
