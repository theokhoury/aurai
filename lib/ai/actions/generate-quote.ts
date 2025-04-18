'use server';

import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers'; // Assuming myProvider is your configured AI provider
// import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'; // No longer needed

export async function generateRandomQuote(): Promise<string> {
  try {
    const result = await generateText({
      // Use the specific quote model
      model: myProvider.languageModel('quote-model'),
      prompt: 'Give a short dark humor quote about performance marketing in an agency and the meaninglesness of life. The quote should be 220 characters or less. ',
      maxTokens: 50, // Limit token usage for a short quote
      temperature: 2, // Allow some creativity
    });

    // Basic cleanup - remove potential surrounding quotes if the model adds them
    const quote = result.text.trim().replace(/^"|"$/g, ''); 
    
    if (!quote) {
        console.warn('AI generated an empty quote.');
        return 'Be the change you wish to see in the world.\nAura Ai'; // Default fallback quote with signature
    }

    return `${quote}\nAura Ai`; // Append signature to the generated quote
  } catch (error) {
    console.error('Error generating random quote:', error);
    // Return a default quote on error with signature
    return 'The journey of a thousand miles begins with a single step.\nAura Ai'; 
  }
} 