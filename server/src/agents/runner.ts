import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
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
}

interface ToolCallInfo {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

const MAX_ITERATIONS = 10; // Prevent infinite loops

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
function extractToolCalls(message: AIMessage): ToolCallInfo[] {
  const toolCalls: ToolCallInfo[] = [];

  if (message.tool_calls && Array.isArray(message.tool_calls)) {
    for (const toolCall of message.tool_calls) {
      toolCalls.push({
        id: toolCall.id || crypto.randomUUID(),
        name: toolCall.name,
        args: toolCall.args as Record<string, unknown>,
      });
    }
  }

  return toolCalls;
}

/**
 * Executes a tool call and returns the result
 */
async function executeToolCall(toolCall: ToolCallInfo): Promise<string> {
  const tools = getTools();
  const tool = tools.find((t) => t.name === toolCall.name);

  if (!tool) {
    return `Error: Unknown tool "${toolCall.name}"`;
  }

  try {
    const result = await tool.invoke(toolCall.args);
    return String(result);
  } catch (error) {
    return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Runs the agent with an agentic loop that handles tool calls
 */
export async function runAgent(options: RunAgentOptions): Promise<string> {
  const { config, message, history, apiKeys, onEvent } = options;

  // Create the chat model with tools bound
  const model = createChatModel(config, apiKeys);
  const tools = getTools();

  // Bind tools to the model if supported
  let modelWithTools: BaseChatModel;
  try {
    modelWithTools = model.bindTools(tools);
  } catch {
    // If binding tools fails, use the model without tools
    modelWithTools = model;
  }

  // Build the message history
  const messages = historyToMessages(history, config.systemPrompt);
  messages.push(new HumanMessage(message));

  let fullContent = '';
  let iterations = 0;

  // Agentic loop - continue until no more tool calls or max iterations reached
  while (iterations < MAX_ITERATIONS) {
    iterations++;

    try {
      // Stream the response
      const stream = await modelWithTools.stream(messages);
      let currentContent = '';
      let aiMessage: AIMessage | null = null;

      for await (const chunk of stream) {
        // Handle content streaming
        if (chunk.content && typeof chunk.content === 'string') {
          currentContent += chunk.content;
          onEvent({ type: 'content', content: chunk.content });
        }

        // Collect the full message for tool call extraction
        if (chunk instanceof AIMessage) {
          aiMessage = chunk;
        }
      }

      // If we have content, add it to the full response
      if (currentContent) {
        fullContent += currentContent;
      }

      // Check for tool calls in the final message
      // We need to make a non-streaming call to get tool calls properly
      if (iterations === 1 || currentContent === '') {
        const response = await modelWithTools.invoke(messages);
        if (response instanceof AIMessage) {
          aiMessage = response;

          // If response has content and we haven't already streamed it
          if (response.content && typeof response.content === 'string' && !currentContent) {
            fullContent += response.content;
            onEvent({ type: 'content', content: response.content });
          }
        }
      }

      if (!aiMessage) {
        break;
      }

      // Extract tool calls
      const toolCalls = extractToolCalls(aiMessage);

      // If no tool calls, we're done
      if (toolCalls.length === 0) {
        break;
      }

      // Add the AI message to history
      messages.push(aiMessage);

      // Execute each tool call
      for (const toolCall of toolCalls) {
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

        // Add tool result to messages
        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id,
          })
        );
      }

      // Continue the loop to get the agent's response after tool execution
    } catch (error) {
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
  const { config, message, history, apiKeys } = options;

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

    for (const toolCall of toolCalls) {
      const result = await executeToolCall(toolCall);
      messages.push(
        new ToolMessage({
          content: result,
          tool_call_id: toolCall.id,
        })
      );
    }
  }

  return fullContent;
}
