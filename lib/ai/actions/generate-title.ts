'use server';

import { generateText } from 'ai';
import { myProvider } from '../providers';
import { type DBMessage } from '@/lib/db/schema';

/**
 * Generates a concise title for an assistant message.
 */
export async function generateTitleFromAssistantMessage(
  message: Pick<DBMessage, 'parts'> // Only need the parts for content
): Promise<string> {
  // Extract text content from parts
  let content = '';
  if (Array.isArray(message.parts)) {
    content = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim();
  }

  if (!content) {
    return 'Bookmarked Message'; // Fallback if no text content
  }

  try {
    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'), // Use the same title model
      system: `\n      - you will generate a short title based on an assistant message content
      - ensure it is not more than 80 characters long
      - the title should be a concise summary of the message\'s key point
      - do not use quotes or colons`, // Slightly adapted prompt
      prompt: content, // Pass the extracted text content
    });
    return title;
  } catch (error) {
    console.error('Error generating bookmark title:', error);
    return 'Bookmarked Message'; // Fallback on error
  }
} 