import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { 
    updateSnippetContent, 
    deleteSnippetById,
    getSnippetsByChatId,
    addSnippet,
    getMessageById
} from '@/lib/db/queries';
import type { Snippet } from '@/lib/db/schema';
import { generateTitleFromAssistantMessage } from '@/lib/ai/actions/generate-title';

// Validation schema for updating a snippet (identified by its unique ID)
const updateSnippetSchema = z.object({
  id: z.string().uuid('Invalid Snippet ID'),
  title: z.string().min(1, 'Title cannot be empty').default('Untitled Snippet'),
  text: z.string().min(1, 'Text content cannot be empty'),
  // groupId: z.string().optional(), // Allow updating group later if needed
});

// Schema for POST requests (bookmarking/adding from message)
const addSnippetSchema = z.object({
  chatId: z.string().uuid('Invalid Chat ID'),
  messageId: z.string().uuid('Invalid Message ID'),
  groupId: z.string().optional(), // Optional group ID for bookmarking
  // Text and Title are usually derived from the message
});

// GET handler for snippets by chatId
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    // If no chatId, this could potentially list *all* snippets, 
    // but that's handled by /api/snippets. 
    // So, require chatId here.
    return NextResponse.json({ error: 'chatId query parameter is required' }, { status: 400 });
  }

  try {
    const snippets = await getSnippetsByChatId({
      chatId,
      userId: session.user.id,
    });
    return NextResponse.json(snippets);
  } catch (error) {
    console.error('Error fetching snippets by chat ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets for this chat' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const body = updateSnippetSchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input', details: body.error.format() }, { status: 400 });
    }

    // Check if text content is meaningful (basic check)
    if (!body.data.text.trim()) {
        return NextResponse.json({ error: 'Text content cannot be empty' }, { status: 400 });
    }

    // Prepare data for updateSnippetContent
    const snippetToUpdate: Pick<Snippet, 'id' | 'userId' | 'title' | 'text'> = {
      id: body.data.id,
      userId,
      title: body.data.title,
      text: body.data.text,
      // groupId: body.data.groupId ?? null, // Add if group updating is needed
    };

    // Call updateSnippetContent using the unique ID
    const updatedSnippet = await updateSnippetContent(snippetToUpdate);

    return NextResponse.json(updatedSnippet);

  } catch (error: any) {
    console.error('Error updating snippet:', error);
    // Handle case where snippet doesn't exist or user doesn't own it (from query function)
    if (error.message.includes('Snippet not found')) {
      return NextResponse.json({ error: 'Snippet not found or permission denied' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update snippet' },
      { status: 500 },
    );
  }
}

// POST handler for bookmarking (adding snippet from message)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    const parsed = addSnippetSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { chatId, messageId, groupId } = parsed.data;

    let title = 'Untitled Snippet';
    let textContent = '';

    // Fetch the message to get content and generate title
    try {
      const [messageToBookmark] = await getMessageById({ id: messageId });
      if (messageToBookmark) {
        // Extract text content from message parts
        if (Array.isArray(messageToBookmark.parts)) {
            textContent = messageToBookmark.parts.find((p: { type: string, text?: string }) => p.type === 'text')?.text || '';
        }
        // Generate title if it was an assistant message
        if (messageToBookmark.role === 'assistant' && textContent) {
          title = await generateTitleFromAssistantMessage(messageToBookmark);
        } else if (!textContent) {
           console.warn('Message to bookmark has no text content.');
           // Keep default title, empty text
        } else {
            // Keep default title for non-assistant messages or if title gen fails
        }
      } else {
        console.error(`Message with ID ${messageId} not found.`);
        return NextResponse.json({ error: 'Message to bookmark not found' }, { status: 404 });
      }
    } catch (fetchError) {
      console.error('Error fetching message or generating title:', fetchError);
      // Proceed with default title and empty text if fetching/generation fails
      // Or return an error if message fetch is critical
      return NextResponse.json({ error: 'Failed to process message for bookmark' }, { status: 500 });
    }

    // Call the database function to add the snippet
    const addedSnippet = await addSnippet({ 
        userId, 
        chatId, 
        messageId, 
        title, 
        text: textContent, 
        groupId: groupId // Pass groupId directly (undefined is acceptable)
    });

    // Handle case where snippet already existed (addSnippet might return existing)
    // Depending on addSnippet implementation, might need status 200 or 201
    return NextResponse.json({ success: true, action: 'added', snippet: addedSnippet }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding snippet (bookmarking): ', error);
    // Handle potential unique constraint errors if addSnippet doesn't check
    if (error.code === '23505') { 
        return NextResponse.json({ error: 'Snippet for this message already exists' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to add snippet' },
      { status: 500 },
    );
  }
}

// DELETE handler using deleteSnippetById
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Expect ID in query params 
  const { searchParams } = new URL(request.url); 
  const snippetId = searchParams.get('id'); 

  if (!snippetId || typeof snippetId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid snippet ID' }, { status: 400 });
  }
  
  // Basic UUID validation (can be stricter if needed)
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(snippetId)) {
    return NextResponse.json({ error: 'Invalid snippet ID format' }, { status: 400 });
  }

  try {
    const deleted = await deleteSnippetById({ id: snippetId, userId });
    if (!deleted) {
      // Could be not found OR user didn't own it
      return NextResponse.json({ error: 'Snippet not found or permission denied' }, { status: 404 });
    }
    // Successfully deleted
    return new Response(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
} 