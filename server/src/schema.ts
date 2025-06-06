
import { z } from 'zod';

// Enums
export const chatModeSchema = z.enum(['smart_answer', 'group_chat', 'autopilot']);
export type ChatMode = z.infer<typeof chatModeSchema>;

export const aiModelSchema = z.enum(['chatgpt', 'gemini', 'deepseek', 'grok']);
export type AiModel = z.infer<typeof aiModelSchema>;

export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof messageRoleSchema>;

export const participantRoleSchema = z.enum(['user', 'assistant', 'moderator', 'expert', 'analyst']);
export type ParticipantRole = z.infer<typeof participantRoleSchema>;

// Conversation schema
export const conversationSchema = z.object({
  id: z.number(),
  title: z.string(),
  mode: chatModeSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Conversation = z.infer<typeof conversationSchema>;

// Message schema
export const messageSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  role: messageRoleSchema,
  content: z.string(),
  ai_model: aiModelSchema.nullable(),
  participant_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

// Participant schema
export const participantSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  role: participantRoleSchema,
  avatar_url: z.string().nullable(),
  ai_model: aiModelSchema.nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type Participant = z.infer<typeof participantSchema>;

// File upload schema
export const fileUploadSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  filename: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  created_at: z.coerce.date()
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// Input schemas for creating
export const createConversationInputSchema = z.object({
  title: z.string(),
  mode: chatModeSchema
});

export type CreateConversationInput = z.infer<typeof createConversationInputSchema>;

export const createMessageInputSchema = z.object({
  conversation_id: z.number(),
  role: messageRoleSchema,
  content: z.string(),
  ai_model: aiModelSchema.nullable().optional(),
  participant_id: z.number().nullable().optional()
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

export const createParticipantInputSchema = z.object({
  conversation_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  role: participantRoleSchema,
  avatar_url: z.string().nullable().optional(),
  ai_model: aiModelSchema.nullable().optional(),
  is_active: z.boolean().optional()
});

export type CreateParticipantInput = z.infer<typeof createParticipantInputSchema>;

export const createFileUploadInputSchema = z.object({
  conversation_id: z.number(),
  filename: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string()
});

export type CreateFileUploadInput = z.infer<typeof createFileUploadInputSchema>;

// Update schemas
export const updateConversationInputSchema = z.object({
  id: z.number(),
  title: z.string().optional()
});

export type UpdateConversationInput = z.infer<typeof updateConversationInputSchema>;

export const updateParticipantInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  role: participantRoleSchema.optional(),
  avatar_url: z.string().nullable().optional(),
  ai_model: aiModelSchema.nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateParticipantInput = z.infer<typeof updateParticipantInputSchema>;

// Query schemas
export const getConversationInputSchema = z.object({
  id: z.number()
});

export type GetConversationInput = z.infer<typeof getConversationInputSchema>;

export const getMessagesInputSchema = z.object({
  conversation_id: z.number(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetMessagesInput = z.infer<typeof getMessagesInputSchema>;

export const getParticipantsInputSchema = z.object({
  conversation_id: z.number()
});

export type GetParticipantsInput = z.infer<typeof getParticipantsInputSchema>;

export const deleteConversationInputSchema = z.object({
  id: z.number()
});

export type DeleteConversationInput = z.infer<typeof deleteConversationInputSchema>;

export const deleteParticipantInputSchema = z.object({
  id: z.number()
});

export type DeleteParticipantInput = z.infer<typeof deleteParticipantInputSchema>;
