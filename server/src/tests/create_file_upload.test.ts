
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversationsTable, fileUploadsTable } from '../db/schema';
import { type CreateFileUploadInput } from '../schema';
import { createFileUpload } from '../handlers/create_file_upload';
import { eq } from 'drizzle-orm';

describe('createFileUpload', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let conversationId: number;

  beforeEach(async () => {
    // Create prerequisite conversation
    const conversationResult = await db.insert(conversationsTable)
      .values({
        title: 'Test Conversation',
        mode: 'smart_answer'
      })
      .returning()
      .execute();
    
    conversationId = conversationResult[0].id;
  });

  const testInput: CreateFileUploadInput = {
    conversation_id: 0, // Will be set to conversationId in tests
    filename: 'test-document.pdf',
    file_path: '/uploads/test-document.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf'
  };

  it('should create a file upload', async () => {
    const input = { ...testInput, conversation_id: conversationId };
    const result = await createFileUpload(input);

    // Basic field validation
    expect(result.conversation_id).toEqual(conversationId);
    expect(result.filename).toEqual('test-document.pdf');
    expect(result.file_path).toEqual('/uploads/test-document.pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save file upload to database', async () => {
    const input = { ...testInput, conversation_id: conversationId };
    const result = await createFileUpload(input);

    // Query using proper drizzle syntax
    const fileUploads = await db.select()
      .from(fileUploadsTable)
      .where(eq(fileUploadsTable.id, result.id))
      .execute();

    expect(fileUploads).toHaveLength(1);
    expect(fileUploads[0].conversation_id).toEqual(conversationId);
    expect(fileUploads[0].filename).toEqual('test-document.pdf');
    expect(fileUploads[0].file_path).toEqual('/uploads/test-document.pdf');
    expect(fileUploads[0].file_size).toEqual(1024000);
    expect(fileUploads[0].mime_type).toEqual('application/pdf');
    expect(fileUploads[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent conversation', async () => {
    const input = { ...testInput, conversation_id: 99999 };
    
    await expect(createFileUpload(input)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle different file types', async () => {
    const imageInput = {
      ...testInput,
      conversation_id: conversationId,
      filename: 'profile-picture.jpg',
      file_path: '/uploads/profile-picture.jpg',
      file_size: 512000,
      mime_type: 'image/jpeg'
    };

    const result = await createFileUpload(imageInput);

    expect(result.filename).toEqual('profile-picture.jpg');
    expect(result.file_path).toEqual('/uploads/profile-picture.jpg');
    expect(result.file_size).toEqual(512000);
    expect(result.mime_type).toEqual('image/jpeg');
  });
});
