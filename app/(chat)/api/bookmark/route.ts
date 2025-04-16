import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import {
  addBookmark,
  removeBookmark,
  getBookmarksByChatId,
  getMessageById,
} from '@/lib/db/queries';
import { generateTitleFromAssistantMessage } from '@/lib/ai/actions/generate-title';

// Schema for POST requests (adding/removing a bookmark)
const bookmarkActionSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  action: z.enum(['add', 'remove']),
});

// GET handler to fetch bookmarks for a chat
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
    const bookmarks = await getBookmarksByChatId({
      chatId,
      userId: session.user.id,
    });
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 },
    );
  }
}

// POST handler to add or remove a bookmark
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = bookmarkActionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { chatId, messageId, action } = parsed.data;
    const userId = session.user.id;

    if (action === 'add') {
      let title = 'Bookmarked Message';
      try {
        const [messageToBookmark] = await getMessageById({ id: messageId });
        if (messageToBookmark && messageToBookmark.role === 'assistant') {
          title = await generateTitleFromAssistantMessage(messageToBookmark);
        } else {
          console.warn('Attempted to bookmark non-assistant message or message not found, using default title.');
        }
      } catch (titleError) {
        console.error('Error fetching message or generating title:', titleError);
      }

      await addBookmark({ userId, chatId, messageId, title });
      return NextResponse.json({ success: true, action: 'added' });
    } else if (action === 'remove') {
      await removeBookmark({ userId, chatId, messageId });
      return NextResponse.json({ success: true, action: 'removed' });
    }
  } catch (error) {
    console.error('Error processing bookmark action:', error);
    return NextResponse.json(
      { error: 'Failed to process bookmark action' },
      { status: 500 },
    );
  }

  // Should not be reached if action is valid
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 