import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import {
  addSnippet,
  removeSnippet,
  getSnippetsByChatId,
  getMessageById,
} from '@/lib/db/queries';
import { generateTitleFromAssistantMessage } from '@/lib/ai/actions/generate-title';

// Schema for POST requests (renamed)
const snippetActionSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  action: z.enum(['add', 'remove']),
});

// GET handler (updated logic)
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
  }

  try {
    const snippets = await getSnippetsByChatId({
      chatId,
      userId: session.user.id,
    });
    return NextResponse.json(snippets);
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 },
    );
  }
}

// POST handler (updated logic)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = snippetActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { chatId, messageId, action } = parsed.data;
    const userId = session.user.id;

    if (action === 'add') {
      let title = 'Untitled Snippet';
      let textContent = '';
      try {
        const [messageToBookmark] = await getMessageById({ id: messageId });
        if (messageToBookmark) {
          if (Array.isArray(messageToBookmark.parts)) {
             textContent = messageToBookmark.parts.find((p: { type: string, text?: string }) => p.type === 'text')?.text || '';
          }
          if (messageToBookmark.role === 'assistant') {
            title = await generateTitleFromAssistantMessage(messageToBookmark);
          } else {
            console.warn('Attempted to create snippet from non-assistant message, using default title.');
          }
        } else {
          console.warn('Message to create snippet from not found, using default title and empty text.');
        }
      } catch (titleError) {
        console.error('Error fetching message or generating title:', titleError);
      }

      await addSnippet({ userId, chatId, messageId, title, text: textContent });
      return NextResponse.json({ success: true, action: 'added' });
    } else if (action === 'remove') {
      await removeSnippet({ userId, chatId, messageId });
      return NextResponse.json({ success: true, action: 'removed' });
    }
  } catch (error) {
    console.error('Error processing snippet action:', error);
    return NextResponse.json(
      { error: 'Failed to process snippet action' },
      { status: 500 },
    );
  }

  // Should not be reached if action is valid
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 