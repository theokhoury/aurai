import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
// Assume running on localhost:3000 for local development
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Saves a file buffer to the local filesystem in the public/uploads directory.
 * Ensures the directory exists before writing.
 * Returns an object containing the local URL path for the saved file.
 */
export async function saveFileLocally(filename: string, fileBuffer: ArrayBuffer) {
  try {
    // Ensure the uploads directory exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    // Construct the full file path
    const filePath = path.join(UPLOADS_DIR, filename);

    // Write the file buffer to the filesystem
    await fs.writeFile(filePath, Buffer.from(fileBuffer));

    // Construct the public URL path
    const relativeUrlPath = path.join('/uploads', filename).replace(/\\/g, '/'); // Ensure forward slashes for URL
    const absoluteUrl = new URL(relativeUrlPath, BASE_URL).toString();

    console.log(`File saved locally to: ${filePath}`);
    console.log(`Accessible at URL: ${absoluteUrl}`);

    // Mimic the Vercel Blob response structure, providing an absolute URL
    return {
      url: absoluteUrl, // Use the absolute URL
      pathname: filename,
      contentType: '', // Determine content type if necessary
      contentDisposition: `attachment; filename="${filename}"`, // Example
    };
  } catch (error) {
    console.error('Failed to save file locally:', error);
    throw new Error('Failed to save file locally');
  }
} 