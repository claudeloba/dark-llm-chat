
import { db } from '../db';
import { fileUploadsTable } from '../db/schema';
import { type CreateFileUploadInput, type FileUpload } from '../schema';

export const createFileUpload = async (input: CreateFileUploadInput): Promise<FileUpload> => {
  try {
    // Insert file upload record
    const result = await db.insert(fileUploadsTable)
      .values({
        conversation_id: input.conversation_id,
        filename: input.filename,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type
      })
      .returning()
      .execute();

    const fileUpload = result[0];
    return fileUpload;
  } catch (error) {
    console.error('File upload creation failed:', error);
    throw error;
  }
};
