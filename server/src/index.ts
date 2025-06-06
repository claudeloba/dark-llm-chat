
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createConversationInputSchema,
  getConversationInputSchema,
  updateConversationInputSchema,
  deleteConversationInputSchema,
  createMessageInputSchema,
  getMessagesInputSchema,
  createParticipantInputSchema,
  getParticipantsInputSchema,
  updateParticipantInputSchema,
  deleteParticipantInputSchema,
  createFileUploadInputSchema,
} from './schema';

// Import handlers
import { createConversation } from './handlers/create_conversation';
import { getConversations } from './handlers/get_conversations';
import { getConversation } from './handlers/get_conversation';
import { updateConversation } from './handlers/update_conversation';
import { deleteConversation } from './handlers/delete_conversation';
import { createMessage } from './handlers/create_message';
import { getMessages } from './handlers/get_messages';
import { createParticipant } from './handlers/create_participant';
import { getParticipants } from './handlers/get_participants';
import { updateParticipant } from './handlers/update_participant';
import { deleteParticipant } from './handlers/delete_participant';
import { createFileUpload } from './handlers/create_file_upload';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Conversation routes
  createConversation: publicProcedure
    .input(createConversationInputSchema)
    .mutation(({ input }) => createConversation(input)),

  getConversations: publicProcedure
    .query(() => getConversations()),

  getConversation: publicProcedure
    .input(getConversationInputSchema)
    .query(({ input }) => getConversation(input)),

  updateConversation: publicProcedure
    .input(updateConversationInputSchema)
    .mutation(({ input }) => updateConversation(input)),

  deleteConversation: publicProcedure
    .input(deleteConversationInputSchema)
    .mutation(({ input }) => deleteConversation(input)),

  // Message routes
  createMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => createMessage(input)),

  getMessages: publicProcedure
    .input(getMessagesInputSchema)
    .query(({ input }) => getMessages(input)),

  // Participant routes
  createParticipant: publicProcedure
    .input(createParticipantInputSchema)
    .mutation(({ input }) => createParticipant(input)),

  getParticipants: publicProcedure
    .input(getParticipantsInputSchema)
    .query(({ input }) => getParticipants(input)),

  updateParticipant: publicProcedure
    .input(updateParticipantInputSchema)
    .mutation(({ input }) => updateParticipant(input)),

  deleteParticipant: publicProcedure
    .input(deleteParticipantInputSchema)
    .mutation(({ input }) => deleteParticipant(input)),

  // File upload routes
  createFileUpload: publicProcedure
    .input(createFileUploadInputSchema)
    .mutation(({ input }) => createFileUpload(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
