import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Calculator tool - performs mathematical calculations
 */
export const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Useful for performing mathematical calculations. Input should be a valid mathematical expression.',
  schema: z.object({
    expression: z.string().describe('The mathematical expression to evaluate, e.g., "2 + 2" or "Math.sqrt(16)"'),
  }),
  func: async ({ expression }) => {
    try {
      // Safe evaluation using Function constructor with Math context
      const result = new Function('Math', `return ${expression}`)(Math);
      return `Result: ${result}`;
    } catch (error) {
      return `Error evaluating expression: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
    timezone: z.string().optional().describe('Optional timezone, e.g., "America/New_York" or "UTC"'),
    format: z.enum(['iso', 'locale', 'unix']).optional().describe('Output format: iso, locale, or unix timestamp'),
  }),
  func: async ({ timezone, format = 'locale' }) => {
    const now = new Date();
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
  },
});

/**
 * Web search simulator - simulates web search results
 */
export const webSearchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for information. Returns simulated search results.',
  schema: z.object({
    query: z.string().describe('The search query'),
    numResults: z.number().optional().describe('Number of results to return (default: 3)'),
  }),
  func: async ({ query, numResults = 3 }) => {
    // This is a simulated search - in production, you'd integrate with a real search API
    const simulatedResults = [
      {
        title: `Information about: ${query}`,
        snippet: `This is a simulated search result for "${query}". In a production environment, this would return real search results from a search API.`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
      },
      {
        title: `${query} - Wikipedia`,
        snippet: `A comprehensive overview of ${query} with detailed information and references.`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`,
      },
      {
        title: `Latest news about ${query}`,
        snippet: `Recent developments and news articles related to ${query}.`,
        url: `https://news.example.com/${encodeURIComponent(query)}`,
      },
    ];

    return JSON.stringify(simulatedResults.slice(0, numResults), null, 2);
  },
});

/**
 * Weather tool - simulates weather data
 */
export const weatherTool = new DynamicStructuredTool({
  name: 'weather',
  description: 'Get current weather information for a location.',
  schema: z.object({
    location: z.string().describe('The city or location to get weather for'),
    units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature units'),
  }),
  func: async ({ location, units = 'celsius' }) => {
    // Simulated weather data
    const temp = Math.floor(Math.random() * 30) + 5;
    const conditions = ['sunny', 'cloudy', 'partly cloudy', 'rainy', 'clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const temperature = units === 'fahrenheit' ? Math.round(temp * 9 / 5 + 32) : temp;
    const unitSymbol = units === 'fahrenheit' ? '°F' : '°C';

    return JSON.stringify({
      location,
      temperature: `${temperature}${unitSymbol}`,
      condition,
      humidity: `${Math.floor(Math.random() * 50) + 30}%`,
      note: 'This is simulated weather data for demonstration purposes.',
    }, null, 2);
  },
});

/**
 * Code executor tool - simulates code execution
 */
export const codeExecutorTool = new DynamicStructuredTool({
  name: 'code_executor',
  description: 'Execute JavaScript code and return the result. Use for calculations, data processing, or generating outputs.',
  schema: z.object({
    code: z.string().describe('JavaScript code to execute'),
  }),
  func: async ({ code }) => {
    try {
      // Create a safe execution context with limited globals
      const safeGlobals = {
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        console: {
          log: (...args: unknown[]) => args.map(a => String(a)).join(' '),
        },
      };

      const result = new Function(...Object.keys(safeGlobals), `return (function() { ${code} })()`)(
        ...Object.values(safeGlobals)
      );

      return `Execution result: ${JSON.stringify(result, null, 2)}`;
    } catch (error) {
      return `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
    type: z.enum(['uuid', 'name', 'email', 'number', 'lorem']).describe('Type of random data to generate'),
    count: z.number().optional().describe('Number of items to generate (default: 1)'),
  }),
  func: async ({ type, count = 1 }) => {
    const generateOne = () => {
      switch (type) {
        case 'uuid':
          return crypto.randomUUID();
        case 'name':
          const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
          const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
          return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        case 'email':
          const domains = ['gmail.com', 'outlook.com', 'example.com'];
          return `user${Math.floor(Math.random() * 10000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
        case 'number':
          return Math.floor(Math.random() * 1000000);
        case 'lorem':
          return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        default:
          return 'Unknown type';
      }
    };

    const results = Array.from({ length: count }, generateOne);
    return count === 1 ? String(results[0]) : JSON.stringify(results, null, 2);
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
    codeExecutorTool,
    randomDataTool,
  ];
}

export type ToolName = 'calculator' | 'current_time' | 'web_search' | 'weather' | 'code_executor' | 'random_data';
