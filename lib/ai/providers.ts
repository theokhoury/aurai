import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
// import { xai } from '@ai-sdk/xai';
import { google } from '@ai-sdk/google'; // Import Google provider
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
        // 'chat-model': xai('grok-2-1212'),
        'chat-model': google('gemini-2.0-flash'), // Use Gemini Pro
        // 'chat-model-reasoning': wrapLanguageModel({
        //   model: xai('grok-3-mini-beta'),
        //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
        // }),
        'chat-model-reasoning': wrapLanguageModel({ // Use Gemini Flash for reasoning
          // model: google('gemini-1.5-flash-latest'),
          model: google('gemini-2.5-pro-exp-03-25'), // Use Gemini 2.0 Flash
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        // 'title-model': xai('grok-2-1212'),
        'title-model': google('gemini-2.0-flash'), // Use Gemini Pro
        // 'artifact-model': xai('grok-2-1212'),
        'artifact-model': google('gemini-2.5-pro-exp-03-25'), // Use Gemini Pro
      },
      // imageModels: { // Commenting out image models for now, can be re-added if needed
      //   'small-model': xai.image('grok-2-image'),
      // },
    });
