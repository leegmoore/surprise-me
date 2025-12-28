import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AgentConfig } from '../types.js';

interface ApiKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

/**
 * Creates a LangChain chat model based on the provider configuration
 */
export function createChatModel(config: AgentConfig, apiKeys: ApiKeys): BaseChatModel {
  const { provider, model, temperature = 0.7, maxTokens = 4096 } = config;

  switch (provider) {
    case 'openai': {
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key is required');
      }
      return new ChatOpenAI({
        model,
        temperature,
        maxTokens,
        openAIApiKey: apiKeys.openai,
        streaming: true,
      });
    }

    case 'anthropic': {
      if (!apiKeys.anthropic) {
        throw new Error('Anthropic API key is required');
      }
      return new ChatAnthropic({
        model,
        temperature,
        maxTokens,
        anthropicApiKey: apiKeys.anthropic,
        streaming: true,
      });
    }

    case 'google': {
      if (!apiKeys.google) {
        throw new Error('Google AI API key is required');
      }
      return new ChatGoogleGenerativeAI({
        model,
        temperature,
        maxOutputTokens: maxTokens,
        apiKey: apiKeys.google,
        streaming: true,
      });
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Gets the provider name for display purposes
 */
export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'google':
      return 'Google AI';
    default:
      return provider;
  }
}
