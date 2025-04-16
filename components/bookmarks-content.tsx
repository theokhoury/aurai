'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { AlertTriangleIcon, BotIcon, LoaderIcon } from 'lucide-react';

import { fetcher } from '@/lib/utils';
import { type DBMessage } from '@/lib/db/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define the expected shape of data from the API
interface BookmarkedMessage extends Omit<DBMessage, 'parts' | 'attachments'> {
  messageId: string;
  title: string;
  bookmarkCreatedAt: Date;
  messageParts: DBMessage['parts'];
}

export function BookmarksContent() {
  const { data: bookmarks, error, isLoading } = useSWR<BookmarkedMessage[]>(
    '/api/bookmarks', // Fetch from the new endpoint
    fetcher,
    { refreshInterval: 5000 }, // Optional: refresh bookmarks periodically
  );

  // Extract the first text part from a message's parts array
  const getFirstTextPart = (parts: DBMessage['parts']): string | null => {
    if (!Array.isArray(parts)) return null; // Basic type check
    const textPart = parts.find((part) => part.type === 'text');
    return textPart ? textPart.text : null;
  };

  return (
    <ScrollArea className="h-full flex-grow">
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">Bookmarks</h2>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <LoaderIcon className="mr-2 size-4 animate-spin" />
            Loading bookmarks...
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load bookmarks. Please try again later.
            </AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && (!bookmarks || bookmarks.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No bookmarks yet.
          </p>
        )}
        {!isLoading && !error && bookmarks && bookmarks.length > 0 && (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => {
              const messageText = getFirstTextPart(bookmark.messageParts);
              return (
                <Link
                  href={`/chat/${bookmark.chatId}#${bookmark.messageId}`}
                  key={bookmark.messageId}
                  className="block p-3 border rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center size-6 rounded-full bg-background border shrink-0 mt-1">
                      <BotIcon className="size-3" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {bookmark.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {messageText ?? ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Bookmarked:{' '}
                        {new Date(bookmark.bookmarkCreatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
} 