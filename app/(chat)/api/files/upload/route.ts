// import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs'; // Import fs promises
import path from 'path'; // Import path
import crypto from 'crypto'; // Import crypto for unique names

import { auth } from '@/app/(auth)/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      // Generate a unique filename to avoid collisions and potential security issues
      const uniqueFilename = `${crypto.randomUUID()}-${filename}`;
      const storageDir = path.join(process.cwd(), 'local_storage', 'blobs');
      const localPath = path.join(storageDir, uniqueFilename);

      // Ensure the storage directory exists
      await fs.mkdir(storageDir, { recursive: true });

      // Write the file to the local filesystem
      await fs.writeFile(localPath, Buffer.from(fileBuffer));

      // Construct the URL to serve the file locally
      const localUrl = `/api/local-files/${encodeURIComponent(uniqueFilename)}`;

      // Return a response mimicking Vercel Blob's structure but with the local URL
      return NextResponse.json({
        url: localUrl,
        pathname: uniqueFilename, // Use the unique name as the pathname identifier
        contentType: file.type,
        contentDisposition: `attachment; filename="${filename}"`, // Keep original filename for download suggestion
      });

      // const data = await put(`${filename}`, fileBuffer, {
      //   access: 'public',
      // });
      //
      // return NextResponse.json(data);
    } catch (error) {
      console.error('Local upload failed:', error); // Log specific error
      return NextResponse.json({ error: 'Local upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}