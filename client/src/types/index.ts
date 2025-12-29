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
  createdAt: string; // ISO string for JSON serialization
}

export interface Message {
  id: string;
  conversationId: string;
  agentId: string | null; // null for user messages
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string; // ISO string for JSON serialization
  isStreaming?: boolean;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentIds: string[];
  messages: Message[];
  createdAt: string; // ISO string for JSON serialization
  updatedAt: string; // ISO string for JSON serialization
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
  type: 'start' | 'content' | 'tool_call' | 'tool_result' | 'end' | 'error' | 'done';
  conversationId?: string;
  agentId?: string;
  messageId?: string;
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  message?: string;
}

export interface ChatRequest {
  message: string;
  agentId: string;
  agent: {
    provider: AgentProvider;
    model: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
  history: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  apiKeys: ApiKeyConfig;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  success: boolean;
}

export interface ServerInfo {
  name: string;
  version: string;
  capabilities: {
    streaming: boolean;
    toolCalling: boolean;
    multiAgent: boolean;
    providers: string[];
  };
  limits: {
    maxMessageLength: number;
    maxHistoryLength: number;
    maxToolIterations: number;
    rateLimitPerMinute: number;
  };
}
