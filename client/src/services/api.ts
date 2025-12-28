import { useChatStore } from '../store';

const API_BASE = '/api';

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

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { conversationId, agentId, message, messageId, stream = true, onStream, onComplete, onError } = options;

  const store = useChatStore.getState();
  const conversation = store.conversations.find(c => c.id === conversationId);
  const agent = store.agents.find(a => a.id === agentId);
  const apiKeys = store.apiKeys;

  if (!conversation || !agent) {
    onError?.(new Error('Conversation or agent not found'));
    return;
  }

  // Build conversation history
  const history = conversation.messages
    .filter(m => m.agentId === null || m.agentId === agentId)
    .map(m => ({
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
    if (stream) {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete?.(fullContent);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content') {
                  fullContent += parsed.content;
                  onStream?.(parsed.content);
                } else if (parsed.type === 'tool_call') {
                  // Handle tool call visualization
                  onStream?.(`\n\n> **Tool Call:** ${parsed.tool}\n> ${JSON.stringify(parsed.args, null, 2)}\n\n`);
                } else if (parsed.type === 'tool_result') {
                  onStream?.(`> **Result:** ${parsed.result}\n\n`);
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      onComplete?.(fullContent);
    } else {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const data = await response.json();
      onComplete?.(data.content);
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function regenerateResponse(options: RegenerateOptions): Promise<void> {
  const { conversationId, agentId, messageId, stream = true, onStream, onComplete, onError } = options;

  const store = useChatStore.getState();
  const conversation = store.conversations.find(c => c.id === conversationId);
  const agent = store.agents.find(a => a.id === agentId);

  if (!conversation || !agent) {
    onError?.(new Error('Conversation or agent not found'));
    return;
  }

  // Find the message to regenerate and the last user message before it
  const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
  const previousMessages = conversation.messages.slice(0, messageIndex);
  const userMessages = previousMessages.filter(m => m.role === 'user');
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    onError?.(new Error('No user message found to regenerate from'));
    return;
  }

  // Build history up to the last user message
  const history = previousMessages
    .filter(m => m.agentId === null || m.agentId === agentId)
    .map(m => ({
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
    history: history.slice(0, -1), // Remove the last user message since we're including it separately
    apiKeys: store.apiKeys,
    stream,
  };

  try {
    if (stream) {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                onComplete?.(fullContent);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content') {
                  fullContent += parsed.content;
                  onStream?.(parsed.content);
                } else if (parsed.type === 'tool_call') {
                  onStream?.(`\n\n> **Tool Call:** ${parsed.tool}\n> ${JSON.stringify(parsed.args, null, 2)}\n\n`);
                } else if (parsed.type === 'tool_result') {
                  onStream?.(`> **Result:** ${parsed.result}\n\n`);
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      onComplete?.(fullContent);
    } else {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate response');
      }

      const data = await response.json();
      onComplete?.(data.content);
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
}

export async function getConversations(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return response.json();
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
}
