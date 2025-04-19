'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { AlertTriangleIcon, BotIcon, LoaderIcon, PlusIcon } from 'lucide-react';

import { fetcher } from '@/lib/utils';
import { type DBMessage } from '@/lib/db/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { emitter } from '@/lib/event-emitter';

// Define the expected shape of data from the API
interface BookmarkedMessage extends Omit<DBMessage, 'parts' | 'attachments'> {
  messageId: string;
  title: string;
  bookmarkCreatedAt: Date;
  messageParts: DBMessage['parts'];
}

export function BookmarksContent() {
  const { data: bookmarks, error, isLoading } = useSWR<BookmarkedMessage[]>(
    '/api/snippets', // Use the snippets endpoint
    fetcher,
    { refreshInterval: 5000 }, // Optional: refresh bookmarks periodically
  );

  // Extract the first text part from a message's parts array
  const getFirstTextPart = (parts: DBMessage['parts']): string | null => {
    if (!Array.isArray(parts)) return null; // Basic type check
    const textPart = parts.find((part) => part.type === 'text');
    return textPart ? textPart.text : null;
  };

  const handleBookmarkClick = (title: string, text: string | null) => {
    if (text) {
      emitter.emit('displayBookmarkedMessage', { title, text });
    }
    // Link navigation still happens
  };

  return (
    <ScrollArea className="h-full grow">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/snippets" className="group">
            <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
              Snippets
            </h2>
          </Link>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => {
                    console.log('Add bookmark clicked');
                  }}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Add Bookmark
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <LoaderIcon className="mr-2 size-4 animate-spin" />
            Loading bookmarks...
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
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
                <button
                  key={bookmark.messageId}
                  className="block w-full text-left p-3 border rounded-md hover:bg-muted transition-colors"
                  onClick={() => handleBookmarkClick(bookmark.title, messageText)}
                  aria-label={`Select snippet: ${bookmark.title}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {bookmark.title}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
} 
 
 
 
 