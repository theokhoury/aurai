import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { UIMessage } from 'ai';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { UIArtifact } from './artifact';
import { UseChatHelpers } from '@ai-sdk/react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { Snippet } from '@/lib/db/schema';

export interface ArtifactMessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  artifactStatus: UIArtifact['status'];
}

function PureArtifactMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: ArtifactMessagesProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const { data: snippetsData } = useSWR<Snippet[]>(
    chatId ? `/api/snippets?chatId=${chatId}` : null,
    fetcher
  );

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => {
        const snippetId = snippetsData?.find(s => s.messageId === message.id)?.id ?? undefined;
        
        return (
          <PreviewMessage
            chatId={chatId}
            key={message.id}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            snippetId={snippetId}
          />
        );
      })}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps,
) {
  if (
    prevProps.artifactStatus === 'streaming' &&
    nextProps.artifactStatus === 'streaming'
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
