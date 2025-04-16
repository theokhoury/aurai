import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
// import { xai } from '@ai-sdk/xai'; // Remove xAI import
import { createGoogleGenerativeAI } from '@ai-sdk/google'; // Correct Google AI SDK import
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': createGoogleGenerativeAI()('models/gemini-2.0-flash'), // Keep chat model as 2.0 flash
        'chat-model-reasoning': wrapLanguageModel({
          // Use the specified experimental model for reasoning
          model: createGoogleGenerativeAI()('models/gemini-2.5-pro-exp-03-25'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': createGoogleGenerativeAI()('models/gemini-2.0-flash'), // Keep title model as 2.0 flash
        // Use the specified experimental model for artifact generation
        'artifact-model': createGoogleGenerativeAI()('models/gemini-2.5-pro-exp-03-25'),
      },
      // Remove imageModels section as Gemini API via AI SDK doesn't directly support it here
    });
