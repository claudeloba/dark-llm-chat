
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const chatModeEnum = pgEnum('chat_mode', ['smart_answer', 'group_chat', 'autopilot']);
export const aiModelEnum = pgEnum('ai_model', ['chatgpt', 'gemini', 'deepseek', 'grok']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const participantRoleEnum = pgEnum('participant_role', ['user', 'assistant', 'moderator', 'expert', 'analyst']);

// Conversations table
export const conversationsTable = pgTable('conversations', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  mode: chatModeEnum('mode').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  ai_model: aiModelEnum('ai_model'),
  participant_id: integer('participant_id').references(() => participantsTable.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Participants table
export const participantsTable = pgTable('participants', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  role: participantRoleEnum('role').notNull(),
  avatar_url: text('avatar_url'),
  ai_model: aiModelEnum('ai_model'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// File uploads table
export const fileUploadsTable = pgTable('file_uploads', {
  id: serial('id').primaryKey(),
  conversation_id: integer('conversation_id').notNull().references(() => conversationsTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const conversationsRelations = relations(conversationsTable, ({ many }) => ({
  messages: many(messagesTable),
  participants: many(participantsTable),
  fileUploads: many(fileUploadsTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [messagesTable.conversation_id],
    references: [conversationsTable.id],
  }),
  participant: one(participantsTable, {
    fields: [messagesTable.participant_id],
    references: [participantsTable.id],
  }),
}));

export const participantsRelations = relations(participantsTable, ({ one, many }) => ({
  conversation: one(conversationsTable, {
    fields: [participantsTable.conversation_id],
    references: [conversationsTable.id],
  }),
  messages: many(messagesTable),
}));

export const fileUploadsRelations = relations(fileUploadsTable, ({ one }) => ({
  conversation: one(conversationsTable, {
    fields: [fileUploadsTable.conversation_id],
    references: [conversationsTable.id],
  }),
}));

// Export all tables
export const tables = {
  conversations: conversationsTable,
  messages: messagesTable,
  participants: participantsTable,
  fileUploads: fileUploadsTable,
};
