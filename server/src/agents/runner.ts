import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage, AIMessageChunk } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getTools } from '../tools/index.js';
import { createChatModel } from '../providers/factory.js';
import type { AgentConfig, ChatMessage, StreamEvent } from '../types.js';

interface RunAgentOptions {
  config: AgentConfig;
  message: string;
  history: ChatMessage[];
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  onEvent: (event: StreamEvent) => void;
  signal?: AbortSignal;
}

interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

const MAX_ITERATIONS = 10;
const TOOL_TIMEOUT_MS = 30000;

/**
 * Converts chat history to LangChain message format
 */
function historyToMessages(history: ChatMessage[], systemPrompt?: string): BaseMessage[] {
  const messages: BaseMessage[] = [];

  if (systemPrompt) {
    messages.push(new SystemMessage(systemPrompt));
  }

  for (const msg of history) {
    switch (msg.role) {
      case 'user':
        messages.push(new HumanMessage(msg.content));
        break;
      case 'assistant':
        messages.push(new AIMessage(msg.content));
        break;
      case 'system':
        messages.push(new SystemMessage(msg.content));
        break;
    }
  }

  return messages;
}

/**
 * Extracts tool calls from an AI message
 */
function extractToolCalls(message: AIMessage | AIMessageChunk): ToolCallInfo[] {
  const toolCalls: ToolCallInfo[] = [];

  if (message.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      if (toolCall.name && toolCall.args) {
        toolCalls.push({
          id: toolCall.id || crypto.randomUUID(),
          name: toolCall.name,
          args: toolCall.args as Record<string, unknown>,
        });
      }
    }
  }

  return toolCalls;
}

/**
 * Executes a tool call with timeout
 */
async function executeToolCall(toolCall: ToolCallInfo, timeoutMs: number = TOOL_TIMEOUT_MS): Promise<string> {
  const tools = getTools();
  const tool = tools.find((t) => t.name === toolCall.name);

  if (!tool) {
    return `Error: Unknown tool "${toolCall.name}"`;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs);
    });

    const result = await Promise.race([
      tool.invoke(toolCall.args),
      timeoutPromise,
    ]);

    return String(result);
  } catch (error) {
    return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Execute multiple tool calls in parallel with timeout
 */
async function executeToolCallsParallel(
  toolCalls: ToolCallInfo[],
  onEvent: (event: StreamEvent) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  await Promise.all(
    toolCalls.map(async (toolCall) => {
      onEvent({
        type: 'tool_call',
        tool: toolCall.name,
        args: toolCall.args,
      });

      const result = await executeToolCall(toolCall);

      onEvent({
        type: 'tool_result',
        tool: toolCall.name,
        result,
      });

      results.set(toolCall.id, result);
    })
  );

  return results;
}

/**
 * Runs the agent with an agentic loop that handles tool calls
 * Uses streaming for content, falls back to invoke for tool calling
 */
export async function runAgent(options: RunAgentOptions): Promise<string> {
  const { config, message, history, apiKeys, onEvent, signal } = options;

  // Create the chat model
  const model = createChatModel(config, apiKeys);
  const tools = getTools();

  // Bind tools to the model
  let modelWithTools: BaseChatModel;
  try {
    modelWithTools = model.bindTools(tools);
  } catch {
    modelWithTools = model;
  }

  // Build the message history
  const messages = historyToMessages(history, config.systemPrompt);
  messages.push(new HumanMessage(message));

  let fullContent = '';
  let iterations = 0;

  // Agentic loop
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // Check for abort signal
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      // Use invoke for proper tool call handling (streaming doesn't reliably return tool calls)
      const response = await modelWithTools.invoke(messages);

      if (!(response instanceof AIMessage)) {
        break;
      }

      // Stream content to the client character by character for a streaming effect
      const content = typeof response.content === 'string' ? response.content : '';
      if (content) {
        // Chunk the content for streaming effect
        const chunkSize = 10;
        for (let i = 0; i < content.length; i += chunkSize) {
          if (signal?.aborted) {
            throw new Error('Request aborted');
          }
          const chunk = content.slice(i, i + chunkSize);
          onEvent({ type: 'content', content: chunk });
          // Small delay for streaming effect
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        fullContent += content;
      }

      // Extract and handle tool calls
      const toolCalls = extractToolCalls(response);

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        break;
      }

      // Add the AI message to history
      messages.push(response);

      // Execute tool calls in parallel
      const toolResults = await executeToolCallsParallel(toolCalls, onEvent);

      // Add tool results to messages
      for (const toolCall of toolCalls) {
        const result = toolResults.get(toolCall.id) || 'No result';
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id,
          })
        );
      }

      // Continue the loop for agent to respond after tool execution
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onEvent({ type: 'error', message: errorMessage });
      throw error;
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    onEvent({ type: 'content', content: '\n\n[Maximum iterations reached]' });
  }

  onEvent({ type: 'done' });
  return fullContent;
}

/**
 * Runs the agent with true streaming (for providers that support it well)
 */
export async function runAgentStreaming(options: RunAgentOptions): Promise<string> {
  const { config, message, history, apiKeys, onEvent, signal } = options;

  const model = createChatModel(config, apiKeys);
  const tools = getTools();

  let modelWithTools: BaseChatModel;
  try {
    modelWithTools = model.bindTools(tools);
  } catch {
    modelWithTools = model;
  }

  const messages = historyToMessages(history, config.systemPrompt);
  messages.push(new HumanMessage(message));

  let fullContent = '';
  let iterations = 0;
  let pendingToolCalls: ToolCallInfo[] = [];

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    try {
      const stream = await modelWithTools.stream(messages);
      let accumulatedContent = '';
      let lastMessage: AIMessageChunk | null = null;

      for await (const chunk of stream) {
        if (signal?.aborted) {
          throw new Error('Request aborted');
        }

        // Handle content chunks
        if (chunk.content && typeof chunk.content === 'string') {
          accumulatedContent += chunk.content;
          onEvent({ type: 'content', content: chunk.content });
        }

        // Keep track of the last chunk for tool calls
        if (chunk instanceof AIMessageChunk) {
          lastMessage = chunk;
        }
      }

      fullContent += accumulatedContent;

      // Check for tool calls in the final message
      if (lastMessage) {
        pendingToolCalls = extractToolCalls(lastMessage);
      }

      // If no tool calls, we're done
      if (pendingToolCalls.length === 0) {
        break;
      }

      // Create a complete AI message for history
      const aiMessage = new AIMessage({
        content: accumulatedContent,
        tool_calls: pendingToolCalls.map(tc => ({
          id: tc.id,
          name: tc.name,
          args: tc.args,
        })),
      });
      messages.push(aiMessage);

      // Execute tool calls
      const toolResults = await executeToolCallsParallel(pendingToolCalls, onEvent);

      // Add tool results to messages
      for (const toolCall of pendingToolCalls) {
        const result = toolResults.get(toolCall.id) || 'No result';
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id,
          })
        );
      }

      pendingToolCalls = [];
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onEvent({ type: 'error', message: errorMessage });
      throw error;
    }
  }

  onEvent({ type: 'done' });
  return fullContent;
}

/**
 * Runs the agent without streaming (for non-streaming requests)
 */
export async function runAgentSync(options: Omit<RunAgentOptions, 'onEvent'>): Promise<string> {
  const { config, message, history, apiKeys, signal } = options;

  const model = createChatModel(config, apiKeys);
  const tools = getTools();

  let modelWithTools: BaseChatModel;
  try {
    modelWithTools = model.bindTools(tools);
  } catch {
    modelWithTools = model;
  }

  const messages = historyToMessages(history, config.systemPrompt);
  messages.push(new HumanMessage(message));

  let fullContent = '';
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    const response = await modelWithTools.invoke(messages);

    if (!(response instanceof AIMessage)) {
      break;
    }

    if (response.content && typeof response.content === 'string') {
      fullContent += response.content;
    }

    const toolCalls = extractToolCalls(response);

    if (toolCalls.length === 0) {
      break;
    }

    messages.push(response);

    // Execute tool calls in parallel for better performance
    const toolResults = await Promise.all(
      toolCalls.map(async (toolCall) => ({
        id: toolCall.id,
        result: await executeToolCall(toolCall),
      }))
    );

    for (const { id, result } of toolResults) {
      messages.push(
        new ToolMessage({
          content: result,
          tool_call_id: id,
        })
      );
    }
  }

  return fullContent;
}
