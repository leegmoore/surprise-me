import { useChatStore } from '../store';
import type { StreamEvent, ServerInfo, ChatResponse } from '../types';

const API_BASE = '/api';

// Store active abort controllers for cleanup
const activeRequests = new Map<string, AbortController>();

interface SendMessageOptions {
  conversationId: string;
  agentId: string;
  message: string;
  messageId: string;
  stream?: boolean;
  onStream?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

interface RegenerateOptions {
  conversationId: string;
  agentId: string;
  messageId: string;
  stream?: boolean;
  onStream?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Cancel an in-flight request
 */
export function cancelRequest(requestId: string): void {
  const controller = activeRequests.get(requestId);
  if (controller) {
    controller.abort();
    activeRequests.delete(requestId);
  }
}

/**
 * Cancel all in-flight requests
 */
export function cancelAllRequests(): void {
  for (const controller of activeRequests.values()) {
    controller.abort();
  }
  activeRequests.clear();
}

/**
 * Parse SSE stream with proper chunk handling
 */
async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: StreamEvent) => void,
  signal: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data) as StreamEvent;
            onEvent(parsed);
          } catch {
            // Skip invalid JSON - might be partial chunk
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith('data: ')) {
        const data = trimmedLine.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data) as StreamEvent;
            onEvent(parsed);
          } catch {
            // Ignore incomplete data
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const {
    conversationId,
    agentId,
    message,
    messageId,
    stream = true,
    onStream,
    onComplete,
    onError,
  } = options;

  const requestId = `${conversationId}-${messageId}`;
  const abortController = new AbortController();
  activeRequests.set(requestId, abortController);

  const store = useChatStore.getState();
  const conversation = store.conversations.find((c) => c.id === conversationId);
  const agent = store.agents.find((a) => a.id === agentId);
  const apiKeys = store.apiKeys;

  if (!conversation || !agent) {
    activeRequests.delete(requestId);
    onError?.(new Error('Conversation or agent not found'));
    return;
  }

  // Build conversation history (only messages for this agent or user messages)
  const history = conversation.messages
    .filter((m) => m.agentId === null || m.agentId === agentId)
    .filter((m) => !m.isStreaming && !m.error) // Exclude incomplete messages
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const requestBody = {
    message,
    agentId,
    agent: {
      provider: agent.provider,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    },
    history,
    apiKeys,
    stream,
  };

  try {
    const endpoint = stream ? `${API_BASE}/chat/stream` : `${API_BASE}/chat`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (stream && response.body) {
      const reader = response.body.getReader();
      let fullContent = '';

      await parseSSEStream(
        reader,
        (event) => {
          switch (event.type) {
            case 'content':
              if (event.content) {
                fullContent += event.content;
                onStream?.(event.content);
              }
              break;
            case 'tool_call':
              onStream?.(
                `\n\n> **Tool Call:** \`${event.tool}\`\n> \`\`\`json\n> ${JSON.stringify(event.args, null, 2)}\n> \`\`\`\n\n`
              );
              break;
            case 'tool_result':
              onStream?.(`> **Result:** ${event.result}\n\n`);
              break;
            case 'error':
              throw new Error(event.message || 'Stream error');
            case 'done':
              // Stream completed
              break;
          }
        },
        abortController.signal
      );

      onComplete?.(fullContent);
    } else {
      const data = (await response.json()) as ChatResponse;
      onComplete?.(data.content);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled - don't report as error
      return;
    }
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  } finally {
    activeRequests.delete(requestId);
  }
}

export async function regenerateResponse(options: RegenerateOptions): Promise<void> {
  const {
    conversationId,
    agentId,
    messageId,
    stream = true,
    onStream,
    onComplete,
    onError,
  } = options;

  const requestId = `regen-${conversationId}-${messageId}`;
  const abortController = new AbortController();
  activeRequests.set(requestId, abortController);

  const store = useChatStore.getState();
  const conversation = store.conversations.find((c) => c.id === conversationId);
  const agent = store.agents.find((a) => a.id === agentId);

  if (!conversation || !agent) {
    activeRequests.delete(requestId);
    onError?.(new Error('Conversation or agent not found'));
    return;
  }

  // Find the message to regenerate and the last user message before it
  const messageIndex = conversation.messages.findIndex((m) => m.id === messageId);
  const previousMessages = conversation.messages.slice(0, messageIndex);
  const userMessages = previousMessages.filter((m) => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    activeRequests.delete(requestId);
    onError?.(new Error('No user message found to regenerate from'));
    return;
  }

  // Build history up to (but not including) the last user message
  const history = previousMessages
    .filter((m) => m.agentId === null || m.agentId === agentId)
    .filter((m) => !m.isStreaming && !m.error)
    .slice(0, -1) // Exclude the last user message
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const requestBody = {
    message: lastUserMessage.content,
    agentId,
    agent: {
      provider: agent.provider,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
    },
    history,
    apiKeys: store.apiKeys,
    stream,
  };

  try {
    const endpoint = stream ? `${API_BASE}/chat/stream` : `${API_BASE}/chat`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    if (stream && response.body) {
      const reader = response.body.getReader();
      let fullContent = '';

      await parseSSEStream(
        reader,
        (event) => {
          switch (event.type) {
            case 'content':
              if (event.content) {
                fullContent += event.content;
                onStream?.(event.content);
              }
              break;
            case 'tool_call':
              onStream?.(
                `\n\n> **Tool Call:** \`${event.tool}\`\n> \`\`\`json\n> ${JSON.stringify(event.args, null, 2)}\n> \`\`\`\n\n`
              );
              break;
            case 'tool_result':
              onStream?.(`> **Result:** ${event.result}\n\n`);
              break;
            case 'error':
              throw new Error(event.message || 'Stream error');
          }
        },
        abortController.signal
      );

      onComplete?.(fullContent);
    } else {
      const data = (await response.json()) as ChatResponse;
      onComplete?.(data.content);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  } finally {
    activeRequests.delete(requestId);
  }
}

/**
 * Get server info and capabilities
 */
export async function getServerInfo(): Promise<ServerInfo | null> {
  try {
    const response = await fetch(`${API_BASE}/info`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

/**
 * Check server health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available models
 */
export async function getModels(): Promise<Record<string, Array<{ id: string; name: string }>> | null> {
  try {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.models;
  } catch {
    return null;
  }
}

/**
 * Get available tools
 */
export async function getTools(): Promise<Array<{ name: string; description: string }> | null> {
  try {
    const response = await fetch(`${API_BASE}/tools`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.tools;
  } catch {
    return null;
  }
}
