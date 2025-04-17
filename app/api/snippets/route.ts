import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { getSnippetsByUserIdWithMessages } from '@/lib/db/queries';

// GET handler to fetch all snippets (with messages) for the logged-in user
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snippetsWithMessages = await getSnippetsByUserIdWithMessages({
      userId: session.user.id,
    });
    return NextResponse.json(snippetsWithMessages);
  } catch (error) {
    console.error('Error fetching user snippets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 },
    );
  }
} 