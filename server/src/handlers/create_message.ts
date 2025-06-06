
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type CreateMessageInput, type Message } from '../schema';

export const createMessage = async (input: CreateMessageInput): Promise<Message> => {
  try {
    const result = await db.insert(messagesTable)
      .values({
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        ai_model: input.ai_model || null,
        participant_id: input.participant_id || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Message creation failed:', error);
    throw error;
  }
};
