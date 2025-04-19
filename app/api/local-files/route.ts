import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
// import mime from 'mime-types'; // Removed default import
import { lookup } from 'mime-types';

// Removed @ts-ignore
export async function GET(
  request: NextRequest // Only accept request
  // Removed second argument: { params }: { params: { filename: string } }
) {
  try {
    // Get filename from query parameter
    const filename = request.nextUrl.searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename query parameter' }, { status: 400 });
    }

    const requestedFilename = decodeURIComponent(filename);

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
    const contentType = lookup(filePath) || 'application/octet-stream';

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
 
 
 