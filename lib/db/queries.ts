import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  type DBMessage,
  type Chat,
  snippet,
  type Snippet,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(snippet).where(eq(snippet.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(snippet)
        .where(
          and(eq(snippet.chatId, chatId), inArray(snippet.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by chat id after timestamp from database',
      error,
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
export async function getSnippetsByChatId({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}): Promise<Array<Snippet>> {
  try {
    return await db
      .select()
      .from(snippet)
      .where(and(eq(snippet.chatId, chatId), eq(snippet.userId, userId)));
  } catch (error) {
    console.error('Failed to get snippets by chat id from database', error);
    throw error;
  }
}

export async function addSnippet({
  userId,
  chatId,
  messageId,
  title,
  text,
  groupId,
}: {
  userId: string;
  chatId: string;
  messageId: string;
  title: string;
  text: string;
  groupId?: string;
}) {
  try {
    const [existing] = await db
        .select()
        .from(snippet)
        .where(and(
          eq(snippet.userId, userId),
          eq(snippet.chatId, chatId),
          eq(snippet.messageId, messageId)
        ))
        .limit(1);

    if (existing) {
      console.log(`Snippet for message ${messageId} already exists. Skipping add.`);
      return existing;
    }

    const [newSnippet] = await db
      .insert(snippet)
      .values({
        userId,
        chatId,
        messageId,
        title,
        text,
        groupId,
      })
      .returning();

    return newSnippet;
  } catch (error) {
    console.error('Failed to add snippet to database', error);
    throw error;
  }
}

export async function removeSnippet({
  userId,
  chatId,
  messageId,
}: {
  userId: string;
  chatId: string;
  messageId: string;
}) {
  try {
    return await db
      .delete(snippet)
      .where(
        and(
          eq(snippet.userId, userId),
          eq(snippet.chatId, chatId),
          eq(snippet.messageId, messageId),
        ),
      );
  } catch (error) {
    console.error('Failed to remove snippet from database', error);
    throw error;
  }
}

export async function getSnippetsByUserIdWithMessages({ userId }: { userId: string }) {
  try {
    const snippetsWithMessages = await db
      .select({
        id: snippet.id,
        userId: snippet.userId,
        chatId: snippet.chatId,
        messageId: snippet.messageId,
        title: snippet.title,
        text: snippet.text,
        groupId: snippet.groupId,
        createdAt: snippet.createdAt,
        messageParts: message.parts,
      })
      .from(snippet)
      .leftJoin(message, eq(snippet.messageId, message.id))
      .where(eq(snippet.userId, userId))
      .orderBy(desc(snippet.createdAt));

    return snippetsWithMessages;
  } catch (error) {
    console.error('Failed to get snippets with messages from database:', error);
    throw error;
  }
}

export async function createManualSnippet({
  userId,
  title,
  text,
  groupId,
}: Pick<Snippet, 'userId' | 'title' | 'text' | 'groupId'>) {
  try {
    const [newSnippet] = await db
      .insert(snippet)
      .values({
        userId,
        chatId: null,
        messageId: null,
        title,
        text,
        groupId,
      })
      .returning();
    return newSnippet;
  } catch (error) {
    console.error('Failed to create manual snippet in database:', error);
    throw error;
  }
}

export async function updateSnippetContent({
  id,
  userId,
  title,
  text,
}: Pick<Snippet, 'id' | 'userId' | 'title' | 'text'>) {
  try {
    const [updatedSnippet] = await db
      .update(snippet)
      .set({
        title: title,
        text: text,
      })
      .where(
        and(
          eq(snippet.id, id),
          eq(snippet.userId, userId)
        )
      )
      .returning();
    
    if (!updatedSnippet) {
        throw new Error('Snippet not found or user does not have permission to update.');
    }
    return updatedSnippet;
  } catch (error) {
    console.error('Failed to update snippet content in database:', error);
    throw error;
  }
}

export async function deleteSnippetById({
  id,
  userId,
}: Pick<Snippet, 'id' | 'userId'>) {
  try {
    const deletedRows = await db
      .delete(snippet)
      .where(
        and(
          eq(snippet.id, id),
          eq(snippet.userId, userId)
        )
      )
      .returning();

    return deletedRows.length > 0;
  } catch (error) {
    console.error('Failed to delete snippet by ID from database:', error);
    throw error;
  }
}

