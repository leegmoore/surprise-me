export type Provider = 'openai' | 'anthropic' | 'google';

export interface AgentConfig {
  provider: Provider;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  agentId: string;
  agent: AgentConfig;
  history: ChatMessage[];
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  stream?: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ToolResult {
  id: string;
  name: string;
  result: string;
}

export interface StreamEvent {
  type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done';
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  message?: string;
}
