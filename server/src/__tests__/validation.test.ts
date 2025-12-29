import { describe, it, expect } from 'vitest';
import { chatRequestSchema } from '../middleware/validation.js';

describe('Chat Request Validation', () => {
  it('should validate a correct request', () => {
    const validRequest = {
      message: 'Hello, world!',
      agent: {
        provider: 'openai',
        model: 'gpt-4',
      },
      history: [],
      apiKeys: {
        openai: 'sk-test123456789012345678901234567890',
      },
    };

    const result = chatRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should reject empty message', () => {
    const request = {
      message: '',
      agent: {
        provider: 'openai',
        model: 'gpt-4',
      },
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it('should reject message that is too long', () => {
    const request = {
      message: 'a'.repeat(33000),
      agent: {
        provider: 'openai',
        model: 'gpt-4',
      },
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it('should reject invalid provider', () => {
    const request = {
      message: 'Hello',
      agent: {
        provider: 'invalid-provider',
        model: 'gpt-4',
      },
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it('should validate all valid providers', () => {
    const providers = ['openai', 'anthropic', 'google'];

    for (const provider of providers) {
      const request = {
        message: 'Hello',
        agent: {
          provider,
          model: 'test-model',
        },
      };

      const result = chatRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    }
  });

  it('should validate optional parameters', () => {
    const request = {
      message: 'Hello',
      agent: {
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'You are helpful',
        temperature: 0.5,
        maxTokens: 1000,
      },
      history: [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ],
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(true);
  });

  it('should reject invalid temperature', () => {
    const request = {
      message: 'Hello',
      agent: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 3.0, // Max is 2
      },
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });

  it('should reject too many history messages', () => {
    const request = {
      message: 'Hello',
      agent: {
        provider: 'openai',
        model: 'gpt-4',
      },
      history: Array(101).fill({ role: 'user', content: 'test' }),
    };

    const result = chatRequestSchema.safeParse(request);
    expect(result.success).toBe(false);
  });
});
