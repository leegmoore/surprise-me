import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Request validation middleware factory
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request body' });
    }
  };
}

/**
 * Chat request schema
 */
export const chatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(32000, 'Message too long (max 32000 characters)'),
  agentId: z.string().optional(),
  agent: z.object({
    provider: z.enum(['openai', 'anthropic', 'google']),
    model: z.string().min(1).max(100),
    systemPrompt: z.string().max(8000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(128000).optional(),
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(100000),
  })).max(100).optional(),
  apiKeys: z.object({
    openai: z.string().optional(),
    anthropic: z.string().optional(),
    google: z.string().optional(),
  }).optional(),
  stream: z.boolean().optional(),
});

export type ValidatedChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Rate limiter using in-memory store
 * For production, use Redis-based rate limiting
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  // Clean up old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, windowMs);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Request timeout middleware
 */
export function requestTimeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
}

/**
 * API key validation - ensures at least one valid key is provided
 */
export function validateApiKeys(req: Request, res: Response, next: NextFunction) {
  const { agent, apiKeys } = req.body;

  if (!agent || !apiKeys) {
    return next();
  }

  const provider = agent.provider;
  const key = apiKeys[provider];

  if (!key) {
    return res.status(400).json({
      error: `API key required for provider: ${provider}`,
      provider,
    });
  }

  // Basic key format validation
  const keyPatterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9-_]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]{20,}$/,
    google: /^[a-zA-Z0-9-_]{20,}$/,
  };

  const pattern = keyPatterns[provider];
  if (pattern && !pattern.test(key)) {
    return res.status(400).json({
      error: `Invalid API key format for provider: ${provider}`,
      provider,
    });
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    console.log(`[${level}] ${method} ${path} ${status} ${duration}ms`);
  });

  next();
}
