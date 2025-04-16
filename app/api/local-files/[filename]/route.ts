import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import mime from 'mime-types';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const requestedFilename = decodeURIComponent(params.filename);

    // Basic security check: Ensure filename doesn't contain path traversal elements
    // and resolves within the intended directory.
    const storageDir = path.join(process.cwd(), 'local_storage', 'blobs');
    const safeFilename = path.normalize(requestedFilename).replace(/^(\.\.(\/|\\\\|$))+/, ''); // Prevent ..
    const filePath = path.join(storageDir, safeFilename);

    // Check if the resolved path is still within the storage directory
    if (!filePath.startsWith(storageDir)) {
      console.error('Attempted path traversal:', requestedFilename);
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (err) {
      console.error('File not found:', filePath, err);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file content
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Return file content
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        // Add Content-Disposition if you want the browser to download instead of display
        // 'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error('Error serving local file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 