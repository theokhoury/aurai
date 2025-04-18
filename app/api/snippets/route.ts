import { NextResponse } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { 
    getSnippetsByUserIdWithMessages, 
    createManualSnippet
} from '@/lib/db/queries';
import { z } from 'zod';
import type { Snippet } from '@/lib/db/schema';

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

// Validation schema for creating a *manual* snippet
const createManualSnippetSchema = z.object({
  // chatId and messageId are NOT required for manual creation
  title: z.string().min(1, 'Title cannot be empty').default('Untitled Snippet'),
  text: z.string().min(1, 'Text content cannot be empty'),
  groupId: z.string().optional(), // Optional group ID
});

// POST handler to create a new *manual* snippet
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const json = await request.json();
    // Use the new schema for validation
    const body = createManualSnippetSchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input', details: body.error.format() }, { status: 400 });
    }

    // Check if text content is meaningful (basic check)
    if (!body.data.text.trim()) {
        return NextResponse.json({ error: 'Text content cannot be empty' }, { status: 400 });
    }

    // Prepare data for createManualSnippet (no chatId/messageId)
    const newSnippetData: Pick<Snippet, 'userId' | 'title' | 'text' | 'groupId'> = {
        userId,
        title: body.data.title,
        text: body.data.text,
        groupId: body.data.groupId ?? null, // Convert undefined to null
    };

    // Call createManualSnippet
    const createdSnippet = await createManualSnippet(newSnippetData);

    return NextResponse.json(createdSnippet, { status: 201 }); // 201 Created status

  } catch (error: any) {
    console.error('Error creating manual snippet:', error);
    // Note: Duplicate key error (23505) is less likely now without chatId/messageId
    // but could happen if the random UUID generator collides (extremely rare).
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 },
    );
  }
} 