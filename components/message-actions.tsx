import type { Message } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';
import { useSWRConfig } from 'swr';
import type { Bookmark } from '@/lib/db/schema';

import { CopyIcon } from './icons';
import { BookmarkIcon } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function PureMessageActions({
  chatId,
  message,
  isLoading,
  isBookmarked,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
  isBookmarked: boolean | undefined;
}) {
  const { mutate } = useSWRConfig();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                await copyToClipboard(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-bookmark-button"
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                const action = isBookmarked ? 'remove' : 'add';
                const promise = fetch('/api/bookmark', {
                  method: 'POST',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    action,
                  }),
                  headers: { 'Content-Type': 'application/json' },
                });

                toast.promise(promise, {
                  loading: `${action === 'add' ? 'Adding' : 'Removing'} bookmark...`,
                  success: () => {
                    mutate<Array<Bookmark>>(
                      `/api/bookmark?chatId=${chatId}`,
                      (currentBookmarks = []) => {
                        if (action === 'add') {
                          return [
                            ...currentBookmarks,
                            {
                              userId: '',
                              chatId,
                              messageId: message.id,
                              createdAt: new Date(),
                            },
                          ];
                        } else {
                          return currentBookmarks.filter(
                            (b) => b.messageId !== message.id,
                          );
                        }
                      },
                      { revalidate: false },
                    );
                    return `Bookmark ${action === 'add' ? 'added' : 'removed'}!`;
                  },
                  error: `Failed to ${action} bookmark.`,
                });
              }}
            >
              <BookmarkIcon
                className={cn(isBookmarked ? 'fill-current text-foreground' : '')}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isBookmarked ? 'Remove bookmark' : 'Bookmark message'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isBookmarked !== nextProps.isBookmarked) return false;

    return true;
  },
);
