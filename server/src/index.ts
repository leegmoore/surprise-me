import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { runAgent, runAgentSync } from './agents/runner.js';
import { getToolsMetadata } from './tools/index.js';
import {
  validateRequest,
  chatRequestSchema,
  rateLimit,
  requestTimeout,
  validateApiKeys,
  securityHeaders,
  requestLogger,
  type ValidatedChatRequest,
} from './middleware/validation.js';
import type { StreamEvent } from './types.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Global middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(cors({
  origin: isProduction
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting - 100 requests per minute for chat endpoints
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: isProduction ? 60 : 1000,
});

// Request timeout - 2 minutes for chat requests
const chatTimeout = requestTimeout(120000);

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

/**
 * Chat endpoint - non-streaming
 */
app.post('/api/chat',
  chatRateLimit,
  chatTimeout,
  validateRequest(chatRequestSchema),
  validateApiKeys,
  async (req: Request, res: Response) => {
    const abortController = new AbortController();

    // Handle client disconnect
    req.on('close', () => {
      abortController.abort();
    });

    try {
      const { message, agent, history, apiKeys } = req.body as ValidatedChatRequest;

      const content = await runAgentSync({
        config: agent,
        message,
        history: history || [],
        apiKeys: apiKeys || {},
        signal: abortController.signal,
      });

      res.json({ content, success: true });
    } catch (error) {
      console.error('Chat error:', error);

      if (abortController.signal.aborted) {
        return res.status(499).json({ error: 'Client closed request' });
      }

      const statusCode = error instanceof Error && error.message.includes('API key') ? 401 : 500;
      res.status(statusCode).json({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }
);

/**
 * Chat endpoint - streaming with Server-Sent Events
 */
app.post('/api/chat/stream',
  chatRateLimit,
  validateRequest(chatRequestSchema),
  validateApiKeys,
  async (req: Request, res: Response) => {
    const abortController = new AbortController();

    // Handle client disconnect
    req.on('close', () => {
      abortController.abort();
    });

    try {
      const { message, agent, history, apiKeys } = req.body as ValidatedChatRequest;

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // Keep connection alive
      const keepAlive = setInterval(() => {
        if (!res.writableEnded) {
          res.write(':keepalive\n\n');
        }
      }, 15000);

      // Send events as they come
      const sendEvent = (event: StreamEvent) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      };

      try {
        await runAgent({
          config: agent,
          message,
          history: history || [],
          apiKeys: apiKeys || {},
          onEvent: sendEvent,
          signal: abortController.signal,
        });

        // Signal completion
        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
        }
      } finally {
        clearInterval(keepAlive);
        if (!res.writableEnded) {
          res.end();
        }
      }
    } catch (error) {
      console.error('Stream chat error:', error);

      if (abortController.signal.aborted) {
        return; // Client disconnected, don't try to respond
      }

      if (!res.headersSent) {
        const statusCode = error instanceof Error && error.message.includes('API key') ? 401 : 500;
        res.status(statusCode).json({
          error: 'Failed to process chat request',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } else if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`);
        res.end();
      }
    }
  }
);

/**
 * Get available tools with their schemas
 */
app.get('/api/tools', (_req: Request, res: Response) => {
  res.json({
    tools: getToolsMetadata(),
    count: getToolsMetadata().length,
  });
});

/**
 * Get available models by provider
 */
app.get('/api/models', (_req: Request, res: Response) => {
  const models = {
    openai: [
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', context: 128000, supportsTools: true },
      { id: 'gpt-4', name: 'GPT-4', context: 8192, supportsTools: true },
      { id: 'gpt-4o', name: 'GPT-4o', context: 128000, supportsTools: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000, supportsTools: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context: 16385, supportsTools: true },
    ],
    anthropic: [
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context: 200000, supportsTools: true },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', context: 200000, supportsTools: true },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', context: 200000, supportsTools: true },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context: 200000, supportsTools: true },
    ],
    google: [
      { id: 'gemini-pro', name: 'Gemini Pro', context: 32000, supportsTools: true },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: 1000000, supportsTools: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context: 1000000, supportsTools: true },
    ],
  };

  res.json({ models });
});

/**
 * Get server info and capabilities
 */
app.get('/api/info', (_req: Request, res: Response) => {
  res.json({
    name: 'Multi-Agent Chat Server',
    version: process.env.npm_package_version || '1.0.0',
    capabilities: {
      streaming: true,
      toolCalling: true,
      multiAgent: true,
      providers: ['openai', 'anthropic', 'google'],
    },
    limits: {
      maxMessageLength: 32000,
      maxHistoryLength: 100,
      maxToolIterations: 10,
      rateLimitPerMinute: isProduction ? 60 : 1000,
    },
  });
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Global error handler
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: isProduction ? 'An unexpected error occurred' : error.message,
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                  Multi-Agent Chat Server                     ║
║──────────────────────────────────────────────────────────────║
║  Server running at http://localhost:${PORT}                     ║
║  Environment: ${isProduction ? 'production' : 'development'}                              ║
║                                                              ║
║  Endpoints:                                                  ║
║  • POST /api/chat        - Non-streaming chat               ║
║  • POST /api/chat/stream - Streaming chat with SSE          ║
║  • GET  /api/tools       - List available tools             ║
║  • GET  /api/models      - List available models            ║
║  • GET  /api/info        - Server info and capabilities     ║
║  • GET  /api/health      - Health check                     ║
║                                                              ║
║  Providers: OpenAI, Anthropic, Google GenAI                  ║
║  Features: Tool calling, Agentic loop, Streaming            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
