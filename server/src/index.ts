import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { runAgent, runAgentSync } from './agents/runner.js';
import type { ChatRequest, StreamEvent } from './types.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Chat endpoint - non-streaming
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, agent, history, apiKeys } = req.body as ChatRequest;

    if (!message || !agent) {
      return res.status(400).json({ error: 'Message and agent configuration are required' });
    }

    const content = await runAgentSync({
      config: agent,
      message,
      history: history || [],
      apiKeys: apiKeys || {},
    });

    res.json({ content });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Chat endpoint - streaming with Server-Sent Events
 */
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, agent, history, apiKeys } = req.body as ChatRequest;

    if (!message || !agent) {
      return res.status(400).json({ error: 'Message and agent configuration are required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send events as they come
    const sendEvent = (event: StreamEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // Run the agent with streaming
    await runAgent({
      config: agent,
      message,
      history: history || [],
      apiKeys: apiKeys || {},
      onEvent: sendEvent,
    });

    // Signal completion
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);

    // If headers haven't been sent, send error as JSON
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } else {
      // If streaming, send error event
      res.write(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
      res.end();
    }
  }
});

/**
 * Get available tools
 */
app.get('/api/tools', (req, res) => {
  const tools = [
    {
      name: 'calculator',
      description: 'Perform mathematical calculations',
      parameters: ['expression'],
    },
    {
      name: 'current_time',
      description: 'Get current date and time',
      parameters: ['timezone', 'format'],
    },
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: ['query', 'numResults'],
    },
    {
      name: 'weather',
      description: 'Get weather information for a location',
      parameters: ['location', 'units'],
    },
    {
      name: 'code_executor',
      description: 'Execute JavaScript code',
      parameters: ['code'],
    },
    {
      name: 'random_data',
      description: 'Generate random data',
      parameters: ['type', 'count'],
    },
  ];

  res.json({ tools });
});

/**
 * Get available models by provider
 */
app.get('/api/models', (req, res) => {
  const models = {
    openai: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', context: 128000 },
      { id: 'gpt-4', name: 'GPT-4', context: 8192 },
      { id: 'gpt-4o', name: 'GPT-4o', context: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context: 16385 },
    ],
    anthropic: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context: 200000 },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', context: 200000 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context: 200000 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context: 200000 },
    ],
    google: [
      { id: 'gemini-pro', name: 'Gemini Pro', context: 32000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: 1000000 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context: 1000000 },
    ],
  };

  res.json({ models });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Multi-Agent Chat Server                     ║
║──────────────────────────────────────────────────────────────║
║  Server running at http://localhost:${PORT}                     ║
║                                                              ║
║  Endpoints:                                                  ║
║  • POST /api/chat        - Non-streaming chat               ║
║  • POST /api/chat/stream - Streaming chat with SSE          ║
║  • GET  /api/tools       - List available tools             ║
║  • GET  /api/models      - List available models            ║
║  • GET  /api/health      - Health check                     ║
║                                                              ║
║  Providers: OpenAI, Anthropic, Google GenAI                  ║
║  Features: Tool calling, Agentic loop, Streaming            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
