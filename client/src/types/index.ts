export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'custom';

export interface Agent {
  id: string;
  name: string;
  provider: AgentProvider;
  model: string;
  avatar?: string;
  color: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  agentId: string | null; // null for user messages
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentIds: string[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isMultiAgent: boolean;
}

export interface ChatSettings {
  theme: 'light' | 'dark' | 'system';
  sendOnEnter: boolean;
  showTimestamps: boolean;
  streamResponses: boolean;
  compactMode: boolean;
}

export interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export interface StreamEvent {
  type: 'start' | 'delta' | 'end' | 'error';
  conversationId: string;
  agentId: string;
  messageId: string;
  content?: string;
  error?: string;
}
