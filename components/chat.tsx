'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, FormEvent } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import { fetcher, generateUUID } from '@/lib/utils';
import type { Bookmark } from '@/lib/db/schema';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { emitter } from '@/lib/event-emitter';
import { Button } from '@/components/ui/button';
import { CrossSmallIcon } from './icons';
import { cn } from '@/lib/utils';

// Type for the displayed bookmark state
interface DisplayedBookmark {
  title: string;
  text: string;
  // Consider adding a unique ID if title/text isn't guaranteed unique
}

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, selectedChatModel: selectedChatModel },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: () => {
      toast.error('An error occurred, please try again!');
    },
  });

  // Fetch bookmarks for this chat
  const { data: bookmarks } = useSWR<Array<Bookmark>>(
    messages.length >= 1 ? `/api/bookmark?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  // State for multiple selected bookmarks
  const [selectedBookmarks, setSelectedBookmarks] = useState<Array<DisplayedBookmark>>([]);

  // Effect to listen for bookmark clicks
  useEffect(() => {
    const handleDisplayBookmark = (payload: DisplayedBookmark) => {
      setSelectedBookmarks((prev) => {
        // Avoid adding duplicates (simple check based on title for now)
        if (prev.some(b => b.title === payload.title)) {
           return prev;
        }
        return [...prev, payload];
      });
      // Removed setInput(''); - Keep current input when selecting bookmarks
    };

    emitter.on('displayBookmarkedMessage', handleDisplayBookmark);

    // Cleanup listener on component unmount
    return () => {
      emitter.off('displayBookmarkedMessage', handleDisplayBookmark);
    };
  }, []); // Removed setInput from dependencies

  // Function to remove a specific bookmark from selection
  const removeSelectedBookmark = (bookmarkToRemove: DisplayedBookmark) => {
    setSelectedBookmarks((prev) => prev.filter(b => b.title !== bookmarkToRemove.title)); // Simple check
  };

  // Function to clear all selected bookmarks
  const clearSelectedBookmarks = () => {
    setSelectedBookmarks([]);
    // Consider focusing input?
    // document.querySelector<HTMLTextAreaElement>('textarea[data-testid=\"multimodal-input\"]')?.focus();
  };

  // Custom form submission handler triggered by MultimodalInput's requestSubmit
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Always prevent default because this handler now controls submission flow
    e.preventDefault();

    // Map attachments to a serializable format (e.g., just URLs)
    const serializableAttachments = attachments.map(a => ({ url: a.url }));

    if (selectedBookmarks.length > 0) {
      // Combine bookmark text and current input, prefixing each snippet with its number
      const combinedBookmarkText = selectedBookmarks
        .map((b, index) => `**Snippet ${index + 1}:**\n\n${b.text}`) // Prepend "Snippet [number]: " to each
        .join('\n\n'); // Use actual newlines
      const currentInput = input; // Get current input from useChat state
      // Combine current input with bookmark text, adding a double newline separator if input exists
      const combinedContent = (currentInput ? `${currentInput}\n\n` : '') + combinedBookmarkText; // Input first, then snippets

      // Append the combined message
      append({
        role: 'user',
        content: combinedContent,
        // Pass mapped attachments
        data: { attachments: serializableAttachments }
      });

      // Clear relevant states after sending
      setSelectedBookmarks([]);
      setAttachments([]);
      setInput('');

    } else if (input.trim().length > 0 || attachments.length > 0) {
      // No bookmarks selected, standard submission with input/attachments
      append({
        role: 'user',
        content: input,
        // Pass mapped attachments
        data: { attachments: serializableAttachments }
      });

      // Clear relevant states after sending
      setAttachments([]);
      setInput('');
    }
    // If no bookmarks and no input/attachments, do nothing.
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={id}
          status={status}
          bookmarks={bookmarks}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex flex-col mx-auto px-4 pb-4 md:pb-6 w-full md:max-w-3xl">
          {/* Display Selected Bookmarks */}
          {selectedBookmarks.length > 0 && (
            <div className={cn(
                'relative mb-2 flex flex-col gap-2 rounded-md border bg-background p-3 shadow-sm',
                'animate-in fade-in duration-300'
              )}
            >
              <p className="text-sm font-medium">Snippets ({selectedBookmarks.length}):</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedBookmarks.map((bookmark, index) => (
                  <div
                    key={`${bookmark.title}-${index}`} // Use title + index for key
                    className="flex max-w-xs items-center gap-1 whitespace-nowrap rounded-full border bg-secondary px-2 py-0.5 text-xs"
                  >
                    <span className="truncate" title={bookmark.title}>{bookmark.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 shrink-0 rounded-full"
                      onClick={() => removeSelectedBookmark(bookmark)}
                      aria-label={`Remove snippet: ${bookmark.title}`}
                    >
                      <CrossSmallIcon className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Clear All Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={clearSelectedBookmarks}
                aria-label="Clear all selected snippets"
              >
                <CrossSmallIcon className="size-4" />
              </Button>
            </div>
          )}

          <form className="flex bg-background gap-2 w-full" onSubmit={handleFormSubmit}>
            {!isReadonly && (
              <MultimodalInput
                chatId={id}
                input={input}
                setInput={setInput}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                append={append}
                setMessages={setMessages}
              />
            )}
          </form>
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
      />
    </>
  );
}
