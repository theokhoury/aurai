import { auth } from '@/app/(auth)/auth';
import { NextRequest } from 'next/server';
// Import the function to get saved chats (will be created in queries.ts)
import { getSavedChatsByUserId } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = parseInt(searchParams.get('limit') || '20'); // Match PAGE_SIZE from frontend
  // Using endingBefore cursor based on sidebar-saved component
  const endingBefore = searchParams.get('ending_before');
  const startingAfter = null; // Not currently used by sidebar-saved component

  const session = await auth();

  if (!session?.user?.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  try {
    // Call the function to get saved chats
    const savedChatsData = await getSavedChatsByUserId({
      userId: session.user.id,
      limit,
      startingAfter, // Pass null or implement if needed
      endingBefore,
    });

    // Return the data in the expected format { chats: [...], hasMore: boolean }
    return Response.json(savedChatsData);
  } catch (error) {
    console.error("Error fetching saved chats:", error);
    return Response.json('Failed to fetch saved chats!', { status: 500 });
  }
} 