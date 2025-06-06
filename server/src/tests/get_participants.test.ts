
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, participantsTable } from '../db/schema';
import { type GetParticipantsInput, type CreateConversationInput, type CreateParticipantInput } from '../schema';
import { getParticipants } from '../handlers/get_participants';

describe('getParticipants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return participants for a conversation', async () => {
    // Create conversation first
    const conversationInput: CreateConversationInput = {
      title: 'Test Conversation',
      mode: 'group_chat'
    };

    const conversationResult = await db.insert(conversationsTable)
      .values(conversationInput)
      .returning()
      .execute();

    const conversationId = conversationResult[0].id;

    // Create participants
    const participantInputs: CreateParticipantInput[] = [
      {
        conversation_id: conversationId,
        name: 'Alice',
        description: 'AI Assistant',
        role: 'assistant',
        avatar_url: 'https://example.com/alice.jpg',
        ai_model: 'chatgpt',
        is_active: true
      },
      {
        conversation_id: conversationId,
        name: 'Bob',
        description: 'Human moderator',
        role: 'moderator',
        avatar_url: null,
        ai_model: null,
        is_active: true
      }
    ];

    await db.insert(participantsTable)
      .values(participantInputs)
      .execute();

    // Test the handler
    const input: GetParticipantsInput = {
      conversation_id: conversationId
    };

    const result = await getParticipants(input);

    expect(result).toHaveLength(2);
    
    // Check first participant
    const alice = result.find(p => p.name === 'Alice');
    expect(alice).toBeDefined();
    expect(alice!.name).toEqual('Alice');
    expect(alice!.description).toEqual('AI Assistant');
    expect(alice!.role).toEqual('assistant');
    expect(alice!.avatar_url).toEqual('https://example.com/alice.jpg');
    expect(alice!.ai_model).toEqual('chatgpt');
    expect(alice!.is_active).toEqual(true);
    expect(alice!.conversation_id).toEqual(conversationId);
    expect(alice!.id).toBeDefined();
    expect(alice!.created_at).toBeInstanceOf(Date);

    // Check second participant
    const bob = result.find(p => p.name === 'Bob');
    expect(bob).toBeDefined();
    expect(bob!.name).toEqual('Bob');
    expect(bob!.description).toEqual('Human moderator');
    expect(bob!.role).toEqual('moderator');
    expect(bob!.avatar_url).toBeNull();
    expect(bob!.ai_model).toBeNull();
    expect(bob!.is_active).toEqual(true);
    expect(bob!.conversation_id).toEqual(conversationId);
    expect(bob!.id).toBeDefined();
    expect(bob!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for conversation with no participants', async () => {
    // Create conversation without participants
    const conversationInput: CreateConversationInput = {
      title: 'Empty Conversation',
      mode: 'smart_answer'
    };

    const conversationResult = await db.insert(conversationsTable)
      .values(conversationInput)
      .returning()
      .execute();

    const conversationId = conversationResult[0].id;

    const input: GetParticipantsInput = {
      conversation_id: conversationId
    };

    const result = await getParticipants(input);

    expect(result).toHaveLength(0);
  });

  it('should only return participants for the specified conversation', async () => {
    // Create two conversations
    const conversation1Result = await db.insert(conversationsTable)
      .values({ title: 'Conversation 1', mode: 'group_chat' })
      .returning()
      .execute();

    const conversation2Result = await db.insert(conversationsTable)
      .values({ title: 'Conversation 2', mode: 'autopilot' })
      .returning()
      .execute();

    const conv1Id = conversation1Result[0].id;
    const conv2Id = conversation2Result[0].id;

    // Create participants for both conversations
    await db.insert(participantsTable)
      .values([
        {
          conversation_id: conv1Id,
          name: 'Conv1 Participant',
          role: 'user',
          is_active: true
        },
        {
          conversation_id: conv2Id,
          name: 'Conv2 Participant',
          role: 'expert',
          is_active: true
        }
      ])
      .execute();

    // Test that we only get participants for conversation 1
    const input: GetParticipantsInput = {
      conversation_id: conv1Id
    };

    const result = await getParticipants(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Conv1 Participant');
    expect(result[0].conversation_id).toEqual(conv1Id);
  });
});
