import type { Message } from 'ai';
import { useCopyToClipboard } from 'usehooks-ts';
import { useSWRConfig } from 'swr';
import type { Snippet } from '@/lib/db/schema';
import { useState, memo } from 'react';

import { CopyIcon } from './icons';
import { BookmarkIcon, ThumbsDownIcon } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useSnippetGroups } from '@/components/app-sidebar';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import equal from 'fast-deep-equal';

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
  const { snippetGroups } = useSnippetGroups();

  const [isSelectGroupDialogOpen, setIsSelectGroupDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messageToBookmark, setMessageToBookmark] = useState<Message | null>(null);

  if (isLoading) return null;
  if (message.role === 'user') return null;

  const handleSaveSnippet = async () => {
    if (!selectedGroupId || !messageToBookmark) {
      toast.error("Please select a group.");
      return;
    }

    const textToSave = messageToBookmark.parts
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();

    if (!textToSave) {
      toast.error("Cannot save an empty message.");
      setIsSelectGroupDialogOpen(false);
      return;
    }

    const promise = fetch('/api/snippet', {
      method: 'POST',
      body: JSON.stringify({
        chatId,
        messageId: messageToBookmark.id,
        groupId: selectedGroupId,
        action: 'add',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    toast.promise(promise, {
      loading: `Adding snippet...`,
      success: (res) => {
        mutate<Array<Snippet>>(
          `/api/snippets?chatId=${chatId}`,
          (currentSnippets = []) => {
              if (currentSnippets.some(s => s.messageId === messageToBookmark.id)) {
                  return currentSnippets;
              }
              const optimisticSnippet: Snippet = {
                  userId: '',
                  chatId,
                  messageId: messageToBookmark.id,
                  createdAt: new Date(),
                  title: 'Untitled Snippet',
                  text: textToSave,
                  groupId: selectedGroupId,
              };
              return [
                  ...currentSnippets,
                  optimisticSnippet,
              ];
          },
          { revalidate: false },
        );
        setIsSelectGroupDialogOpen(false);
        return `Snippet added!`;
      },
      error: (err) => {
          console.error("Failed to add snippet:", err);
          return `Failed to add snippet.`;
      }
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={isSelectGroupDialogOpen} onOpenChange={setIsSelectGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Snippet to Group</DialogTitle>
            <DialogDescription>
              Select the group where you want to save this message snippet.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2 text-sm font-medium">Available Groups:</p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {snippetGroups.map((group) => (
                <Button
                  key={group.id}
                  variant={selectedGroupId === group.id ? "default" : "outline"}
                  onClick={() => setSelectedGroupId(group.id)}
                  className="justify-start"
                >
                  <group.icon className="mr-2 h-4 w-4" />
                  {group.name}
                </Button>
              ))}
              {snippetGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">No snippet groups found. Create one in the sidebar.</p>
              )}
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
                 <Button variant="ghost">Cancel</Button>
             </DialogClose>
            <Button
              type="button"
              onClick={handleSaveSnippet}
              disabled={!selectedGroupId}
            >
              Save Snippet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                if (isBookmarked) {
                  const removePromise = fetch('/api/snippet', {
                    method: 'POST',
                    body: JSON.stringify({
                      chatId,
                      messageId: message.id,
                      action: 'remove',
                    }),
                    headers: { 'Content-Type': 'application/json' },
                  });

                  toast.promise(removePromise, {
                    loading: `Removing snippet...`,
                    success: () => {
                      mutate<Array<Snippet>>(
                        `/api/snippets?chatId=${chatId}`,
                        (currentSnippets = []) => {
                            return currentSnippets.filter(
                              (s) => s.messageId !== message.id,
                          );
                        },
                        { revalidate: false },
                      );
                      return `Snippet removed!`;
                    },
                    error: `Failed to remove snippet.`,
                  });
                } else {
                  setMessageToBookmark(message);
                  setSelectedGroupId(null);
                  setIsSelectGroupDialogOpen(true);
                }
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              onClick={async () => {
                const downvotePromise = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down',
                  }),
                });

                toast.promise(downvotePromise, {
                  loading: 'Downvoting Response...',
                  success: () => {
                    mutate(`/api/vote?chatId=${chatId}`);
                    return 'Downvoted Response!';
                  },
                  error: 'Failed to downvote response.',
                });
              }}
            >
              <ThumbsDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Downvote Response</TooltipContent>
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
    if (!equal(prevProps.message, nextProps.message)) return false;

    return true;
  },
);

