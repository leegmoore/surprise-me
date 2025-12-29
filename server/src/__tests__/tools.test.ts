import { describe, it, expect } from 'vitest';
import {
  calculatorTool,
  currentTimeTool,
  webSearchTool,
  weatherTool,
  jsonProcessorTool,
  randomDataTool,
  urlInfoTool,
} from '../tools/index.js';

describe('Calculator Tool', () => {
  it('should evaluate simple arithmetic', async () => {
    const result = await calculatorTool.invoke({ expression: '2 + 2' });
    expect(result).toBe('Result: 4');
  });

  it('should handle multiplication', async () => {
    const result = await calculatorTool.invoke({ expression: '5 * 3' });
    expect(result).toBe('Result: 15');
  });

  it('should handle Math functions', async () => {
    const result = await calculatorTool.invoke({ expression: 'sqrt(16)' });
    expect(result).toBe('Result: 4');
  });

  it('should handle pow function', async () => {
    const result = await calculatorTool.invoke({ expression: 'pow(2, 8)' });
    expect(result).toBe('Result: 256');
  });

  it('should reject invalid expressions', async () => {
    const result = await calculatorTool.invoke({ expression: 'process.exit(1)' });
    expect(result).toContain('Error');
  });

  it('should reject function calls', async () => {
    const result = await calculatorTool.invoke({ expression: 'eval("1+1")' });
    expect(result).toContain('Error');
  });

  it('should handle exponentiation with ^', async () => {
    const result = await calculatorTool.invoke({ expression: '2 ^ 3' });
    expect(result).toBe('Result: 8');
  });

  it('should handle PI constant', async () => {
    const result = await calculatorTool.invoke({ expression: 'PI' });
    expect(result).toBe(`Result: ${Math.PI}`);
  });
});

describe('Current Time Tool', () => {
  it('should return current time in locale format', async () => {
    const result = await currentTimeTool.invoke({});
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should return ISO format', async () => {
    const result = await currentTimeTool.invoke({ format: 'iso' });
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should return unix timestamp', async () => {
    const result = await currentTimeTool.invoke({ format: 'unix' });
    const timestamp = parseInt(result);
    expect(timestamp).toBeGreaterThan(0);
  });

  it('should handle invalid timezone gracefully', async () => {
    const result = await currentTimeTool.invoke({ timezone: 'Invalid/Timezone' });
    expect(result).toContain('Error');
  });
});

describe('Web Search Tool', () => {
  it('should return search results', async () => {
    const result = await webSearchTool.invoke({ query: 'test query' });
    const parsed = JSON.parse(result);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
  });

  it('should respect numResults parameter', async () => {
    const result = await webSearchTool.invoke({ query: 'test', numResults: 1 });
    const parsed = JSON.parse(result);
    expect(parsed.length).toBe(1);
  });

  it('should sanitize HTML in query', async () => {
    const result = await webSearchTool.invoke({ query: '<script>alert(1)</script>' });
    expect(result).not.toContain('<script>');
  });
});

describe('Weather Tool', () => {
  it('should return weather data', async () => {
    const result = await weatherTool.invoke({ location: 'New York' });
    const parsed = JSON.parse(result);
    expect(parsed.location).toBe('New York');
    expect(parsed.temperature).toBeTruthy();
    expect(parsed.condition).toBeTruthy();
  });

  it('should support fahrenheit units', async () => {
    const result = await weatherTool.invoke({ location: 'London', units: 'fahrenheit' });
    const parsed = JSON.parse(result);
    expect(parsed.temperature).toContain('°F');
  });

  it('should support celsius units', async () => {
    const result = await weatherTool.invoke({ location: 'Paris', units: 'celsius' });
    const parsed = JSON.parse(result);
    expect(parsed.temperature).toContain('°C');
  });
});

describe('JSON Processor Tool', () => {
  const testData = JSON.stringify([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 },
  ]);

  it('should count items', async () => {
    const result = await jsonProcessorTool.invoke({ data: testData, operation: 'count' });
    expect(result).toBe('3');
  });

  it('should filter items', async () => {
    const result = await jsonProcessorTool.invoke({
      data: testData,
      operation: 'filter',
      field: 'name',
      value: 'Alice',
    });
    const parsed = JSON.parse(result);
    expect(parsed.length).toBe(1);
    expect(parsed[0].name).toBe('Alice');
  });

  it('should map field values', async () => {
    const result = await jsonProcessorTool.invoke({
      data: testData,
      operation: 'map',
      field: 'name',
    });
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should sort items', async () => {
    const result = await jsonProcessorTool.invoke({
      data: testData,
      operation: 'sort',
      field: 'age',
      order: 'asc',
    });
    const parsed = JSON.parse(result);
    expect(parsed[0].age).toBe(25);
    expect(parsed[2].age).toBe(35);
  });

  it('should calculate sum', async () => {
    const result = await jsonProcessorTool.invoke({
      data: testData,
      operation: 'sum',
      field: 'age',
    });
    expect(result).toBe('90');
  });

  it('should calculate average', async () => {
    const result = await jsonProcessorTool.invoke({
      data: testData,
      operation: 'average',
      field: 'age',
    });
    expect(result).toBe('30');
  });

  it('should handle invalid JSON', async () => {
    const result = await jsonProcessorTool.invoke({
      data: 'not valid json',
      operation: 'count',
    });
    expect(result).toContain('Error');
  });
});

describe('Random Data Tool', () => {
  it('should generate UUID', async () => {
    const result = await randomDataTool.invoke({ type: 'uuid' });
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should generate name', async () => {
    const result = await randomDataTool.invoke({ type: 'name' });
    expect(result.split(' ').length).toBe(2);
  });

  it('should generate email', async () => {
    const result = await randomDataTool.invoke({ type: 'email' });
    expect(result).toContain('@');
  });

  it('should generate multiple items', async () => {
    const result = await randomDataTool.invoke({ type: 'uuid', count: 5 });
    const parsed = JSON.parse(result);
    expect(parsed.length).toBe(5);
  });

  it('should limit count to 100', async () => {
    const result = await randomDataTool.invoke({ type: 'number', count: 200 });
    const parsed = JSON.parse(result);
    expect(parsed.length).toBe(100);
  });

  it('should generate color', async () => {
    const result = await randomDataTool.invoke({ type: 'color' });
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('URL Info Tool', () => {
  it('should parse URL correctly', async () => {
    const result = await urlInfoTool.invoke({
      url: 'https://example.com:8080/path?query=value#hash',
    });
    const parsed = JSON.parse(result);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe('example.com');
    expect(parsed.port).toBe('8080');
    expect(parsed.pathname).toBe('/path');
    expect(parsed.search).toBe('?query=value');
    expect(parsed.hash).toBe('#hash');
    expect(parsed.searchParams.query).toBe('value');
  });

  it('should handle invalid URL', async () => {
    const result = await urlInfoTool.invoke({ url: 'not a url' });
    expect(result).toContain('Error');
  });
});
