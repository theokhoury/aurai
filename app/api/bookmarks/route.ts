import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { getBookmarksByUserIdWithMessages } from '@/lib/db/queries';

// GET handler to fetch all bookmarks (with messages) for the logged-in user
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookmarksWithMessages = await getBookmarksByUserIdWithMessages({
      userId: session.user.id,
    });
    return NextResponse.json(bookmarksWithMessages);
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 },
    );
  }
} 