import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Safe math expression evaluator
 * Only allows numbers, operators, parentheses, and Math functions
 */
function safeEvaluateMath(expression: string): number {
  // Whitelist of allowed characters and patterns
  const sanitized = expression.trim();

  // Check for disallowed patterns
  const disallowed = /[a-zA-Z_$](?!ath\.|PI|E|abs|ceil|floor|round|sqrt|pow|min|max|sin|cos|tan|log|exp)/;
  if (disallowed.test(sanitized.replace(/Math\./g, ''))) {
    throw new Error('Invalid characters in expression. Only numbers, operators, and Math functions are allowed.');
  }

  // Validate the expression only contains safe tokens
  const safePattern = /^[\d\s+\-*/().,%^]+$|Math\.(PI|E|abs|ceil|floor|round|sqrt|pow|min|max|sin|cos|tan|log|exp|random)\([^)]*\)/;

  // Tokenize and validate
  const tokens = sanitized.match(/Math\.\w+\([^)]*\)|[\d.]+|[+\-*/()%^,\s]/g);
  if (!tokens || tokens.join('') !== sanitized.replace(/\s/g, '')) {
    throw new Error('Expression contains invalid tokens');
  }

  // Create a restricted evaluation context
  const mathContext = {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    sqrt: Math.sqrt,
    pow: Math.pow,
    min: Math.min,
    max: Math.max,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    log: Math.log,
    exp: Math.exp,
    PI: Math.PI,
    E: Math.E,
    random: Math.random,
  };

  // Replace Math.xxx with context calls
  let safeExpression = sanitized
    .replace(/Math\.(\w+)/g, '$1')
    .replace(/\^/g, '**'); // Support ^ for exponentiation

  // Validate final expression is safe (only numbers and operators)
  const finalCheck = /^[\d\s+\-*/().,%*]+$/;
  const expressionWithoutFunctions = safeExpression.replace(/\b(abs|ceil|floor|round|sqrt|pow|min|max|sin|cos|tan|log|exp|PI|E|random)\b/g, '1');

  if (!finalCheck.test(expressionWithoutFunctions)) {
    throw new Error('Expression failed safety validation');
  }

  // Use Function with only math context - much safer than eval
  const fn = new Function(...Object.keys(mathContext), `"use strict"; return (${safeExpression})`);
  const result = fn(...Object.values(mathContext));

  if (typeof result !== 'number' || !isFinite(result)) {
    throw new Error('Expression did not evaluate to a valid number');
  }

  return result;
}

/**
 * Calculator tool - performs safe mathematical calculations
 */
export const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic operators (+, -, *, /, ^, %) and Math functions (sqrt, pow, sin, cos, tan, log, exp, abs, ceil, floor, round, min, max, PI, E).',
  schema: z.object({
    expression: z.string()
      .max(500)
      .describe('The mathematical expression to evaluate, e.g., "2 + 2", "sqrt(16)", "pow(2, 8)"'),
  }),
  func: async ({ expression }) => {
    try {
      const result = safeEvaluateMath(expression);
      return `Result: ${result}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Invalid expression'}`;
    }
  },
});

/**
 * Current time tool - returns the current date and time
 */
export const currentTimeTool = new DynamicStructuredTool({
  name: 'current_time',
  description: 'Returns the current date and time in various formats.',
  schema: z.object({
    timezone: z.string()
      .max(50)
      .optional()
      .describe('Optional timezone, e.g., "America/New_York" or "UTC"'),
    format: z.enum(['iso', 'locale', 'unix'])
      .optional()
      .describe('Output format: iso, locale, or unix timestamp'),
  }),
  func: async ({ timezone, format = 'locale' }) => {
    try {
      const now = new Date();

      // Validate timezone if provided
      if (timezone) {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: timezone });
        } catch {
          return `Error: Invalid timezone "${timezone}"`;
        }
      }

      const options: Intl.DateTimeFormatOptions = timezone
        ? { timeZone: timezone, dateStyle: 'full', timeStyle: 'long' }
        : { dateStyle: 'full', timeStyle: 'long' };

      switch (format) {
        case 'iso':
          return now.toISOString();
        case 'unix':
          return String(Math.floor(now.getTime() / 1000));
        default:
          return now.toLocaleString('en-US', options);
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

/**
 * Web search tool - simulates web search results
 * In production, integrate with a real search API (Google, Bing, Tavily, etc.)
 */
export const webSearchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for information. Returns simulated search results (integrate with real API in production).',
  schema: z.object({
    query: z.string()
      .min(1)
      .max(200)
      .describe('The search query'),
    numResults: z.number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe('Number of results to return (default: 3, max: 10)'),
  }),
  func: async ({ query, numResults = 3 }) => {
    // Sanitize query for URL
    const sanitizedQuery = query.replace(/[<>]/g, '');

    // Simulated search results - replace with real API in production
    const simulatedResults = [
      {
        title: `Information about: ${sanitizedQuery}`,
        snippet: `This is a simulated search result for "${sanitizedQuery}". In production, integrate with a search API like Tavily, Google, or Bing.`,
        url: `https://example.com/search?q=${encodeURIComponent(sanitizedQuery)}`,
      },
      {
        title: `${sanitizedQuery} - Wikipedia`,
        snippet: `A comprehensive overview of ${sanitizedQuery} with detailed information and references.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(sanitizedQuery.replace(/ /g, '_'))}`,
      },
      {
        title: `Latest news about ${sanitizedQuery}`,
        snippet: `Recent developments and news articles related to ${sanitizedQuery}.`,
        url: `https://news.example.com/${encodeURIComponent(sanitizedQuery)}`,
      },
      {
        title: `${sanitizedQuery} - Official Documentation`,
        snippet: `Official documentation and guides for ${sanitizedQuery}.`,
        url: `https://docs.example.com/${encodeURIComponent(sanitizedQuery)}`,
      },
      {
        title: `How to use ${sanitizedQuery}`,
        snippet: `Step-by-step tutorials and guides for ${sanitizedQuery}.`,
        url: `https://tutorial.example.com/${encodeURIComponent(sanitizedQuery)}`,
      },
    ];

    return JSON.stringify(simulatedResults.slice(0, numResults), null, 2);
  },
});

/**
 * Weather tool - simulates weather data
 * In production, integrate with a real weather API (OpenWeatherMap, etc.)
 */
export const weatherTool = new DynamicStructuredTool({
  name: 'weather',
  description: 'Get current weather information for a location (simulated data - integrate with real API in production).',
  schema: z.object({
    location: z.string()
      .min(1)
      .max(100)
      .describe('The city or location to get weather for'),
    units: z.enum(['celsius', 'fahrenheit'])
      .optional()
      .describe('Temperature units (default: celsius)'),
  }),
  func: async ({ location, units = 'celsius' }) => {
    // Sanitize location
    const sanitizedLocation = location.replace(/[<>]/g, '').trim();

    // Simulated weather data - replace with real API in production
    const temp = Math.floor(Math.random() * 30) + 5;
    const conditions = ['sunny', 'cloudy', 'partly cloudy', 'rainy', 'clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const temperature = units === 'fahrenheit' ? Math.round(temp * 9 / 5 + 32) : temp;
    const unitSymbol = units === 'fahrenheit' ? '°F' : '°C';

    return JSON.stringify({
      location: sanitizedLocation,
      temperature: `${temperature}${unitSymbol}`,
      condition,
      humidity: `${Math.floor(Math.random() * 50) + 30}%`,
      wind: `${Math.floor(Math.random() * 20) + 5} km/h`,
      note: 'This is simulated weather data. Integrate with OpenWeatherMap or similar API for production.',
    }, null, 2);
  },
});

/**
 * JSON processor tool - safe data transformation
 * Replaces the unsafe code executor with structured data operations
 */
export const jsonProcessorTool = new DynamicStructuredTool({
  name: 'json_processor',
  description: 'Process and transform JSON data safely. Supports operations like filter, map, sort, aggregate.',
  schema: z.object({
    data: z.string().describe('JSON data to process'),
    operation: z.enum(['filter', 'map', 'sort', 'count', 'sum', 'average', 'unique', 'first', 'last'])
      .describe('Operation to perform'),
    field: z.string().optional().describe('Field name for operations that require it'),
    value: z.string().optional().describe('Value for filter comparison'),
    order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  }),
  func: async ({ data, operation, field, value, order = 'asc' }) => {
    try {
      const parsed = JSON.parse(data);
      const arr = Array.isArray(parsed) ? parsed : [parsed];

      let result: unknown;

      switch (operation) {
        case 'filter':
          if (!field) return 'Error: field is required for filter operation';
          result = arr.filter(item => String(item[field]) === value);
          break;

        case 'map':
          if (!field) return 'Error: field is required for map operation';
          result = arr.map(item => item[field]);
          break;

        case 'sort':
          if (!field) return 'Error: field is required for sort operation';
          result = [...arr].sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return order === 'desc' ? -comparison : comparison;
          });
          break;

        case 'count':
          result = arr.length;
          break;

        case 'sum':
          if (!field) return 'Error: field is required for sum operation';
          result = arr.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
          break;

        case 'average':
          if (!field) return 'Error: field is required for average operation';
          const total = arr.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
          result = arr.length > 0 ? total / arr.length : 0;
          break;

        case 'unique':
          if (!field) return 'Error: field is required for unique operation';
          result = [...new Set(arr.map(item => item[field]))];
          break;

        case 'first':
          result = arr[0];
          break;

        case 'last':
          result = arr[arr.length - 1];
          break;

        default:
          return 'Error: Unknown operation';
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Failed to process JSON'}`;
    }
  },
});

/**
 * Random data generator tool
 */
export const randomDataTool = new DynamicStructuredTool({
  name: 'random_data',
  description: 'Generate random data of various types for testing or examples.',
  schema: z.object({
    type: z.enum(['uuid', 'name', 'email', 'number', 'lorem', 'date', 'phone', 'color'])
      .describe('Type of random data to generate'),
    count: z.number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe('Number of items to generate (default: 1, max: 100)'),
  }),
  func: async ({ type, count = 1 }) => {
    const generateOne = (): string | number => {
      switch (type) {
        case 'uuid':
          return crypto.randomUUID();
        case 'name': {
          const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
          const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
          return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        }
        case 'email': {
          const domains = ['gmail.com', 'outlook.com', 'example.com', 'company.org'];
          const id = Math.floor(Math.random() * 10000);
          return `user${id}@${domains[Math.floor(Math.random() * domains.length)]}`;
        }
        case 'number':
          return Math.floor(Math.random() * 1000000);
        case 'lorem':
          const sentences = [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
            'Duis aute irure dolor in reprehenderit in voluptate velit.',
          ];
          return sentences[Math.floor(Math.random() * sentences.length)];
        case 'date': {
          const start = new Date(2020, 0, 1);
          const end = new Date();
          const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
          return date.toISOString().split('T')[0];
        }
        case 'phone':
          return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        case 'color':
          return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        default:
          return 'Unknown type';
      }
    };

    const results = Array.from({ length: Math.min(count, 100) }, generateOne);
    return count === 1 ? String(results[0]) : JSON.stringify(results, null, 2);
  },
});

/**
 * URL info tool - extracts information from URLs
 */
export const urlInfoTool = new DynamicStructuredTool({
  name: 'url_info',
  description: 'Parse and extract information from a URL.',
  schema: z.object({
    url: z.string().url().describe('The URL to parse'),
  }),
  func: async ({ url }) => {
    try {
      const parsed = new URL(url);
      return JSON.stringify({
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 'default',
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        origin: parsed.origin,
        searchParams: Object.fromEntries(parsed.searchParams),
      }, null, 2);
    } catch (error) {
      return `Error: Invalid URL - ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

/**
 * Get all available tools
 */
export function getTools() {
  return [
    calculatorTool,
    currentTimeTool,
    webSearchTool,
    weatherTool,
    jsonProcessorTool,
    randomDataTool,
    urlInfoTool,
  ];
}

/**
 * Get tool metadata for API responses
 */
export function getToolsMetadata() {
  return getTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    schema: tool.schema,
  }));
}

export type ToolName = 'calculator' | 'current_time' | 'web_search' | 'weather' | 'json_processor' | 'random_data' | 'url_info';
