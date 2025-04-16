import type { Message } from 'ai';
import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote as SaveState } from '@/lib/db/schema';

import { CopyIcon } from './icons';
import { Bookmark } from 'lucide-react';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';

export function PureMessageActions({
  chatId,
  message,
  saveState,
  isLoading,
}: {
  chatId: string;
  message: Message;
  saveState: SaveState | undefined;
  isLoading: boolean;
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
              data-testid="message-save"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant={saveState?.isUpvoted ? 'secondary' : 'outline'}
              onClick={async () => {
                const isCurrentlySaved = saveState?.isUpvoted;
                const typeToSend = isCurrentlySaved ? 'down' : 'up';
                const endpoint = '/api/save';
                const loadingMessage = isCurrentlySaved ? 'Unsaving Response...' : 'Saving Response...';
                const successMessage = isCurrentlySaved ? 'Unsaved Response!' : 'Saved Response!';
                const errorMessage = isCurrentlySaved ? 'Failed to unsave response.' : 'Failed to save response.';

                const saveRequest = fetch(endpoint, {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: typeToSend,
                  }),
                });

                toast.promise(saveRequest, {
                  loading: loadingMessage,
                  success: () => {
                    mutate<Array<SaveState>>(
                      `/api/save?chatId=${chatId}`,
                      (currentSaves) => {
                        if (!currentSaves) return [];
                        const savesWithoutCurrent = currentSaves.filter(
                          (save) => save.messageId !== message.id,
                        );
                        return [
                          ...savesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: !isCurrentlySaved,
                          },
                        ];
                      },
                      { revalidate: false },
                    );
                    return successMessage;
                  },
                  error: errorMessage,
                });
              }}
            >
              <Bookmark size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{saveState?.isUpvoted ? 'Unsave Response' : 'Save Response'}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (!equal(prevProps.saveState, nextProps.saveState)) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
