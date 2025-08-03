import { callOpenAI, completeText, getStructuredResponse, streamResponse } from '../index';

// Mock OpenAI to avoid actual API calls during tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock response' } }],
          model: 'gpt-3.5-turbo',
          usage: { total_tokens: 10 },
        }),
      },
    },
  }));
});

describe('AI Module', () => {
  beforeEach(() => {
    // Set up environment variable for tests
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('callOpenAI', () => {
    it('should call OpenAI with correct parameters', async () => {
      const prompt = 'Test prompt';
      const options = {
        temperature: 0.5,
        maxTokens: 500,
        model: 'gpt-4',
      };

      const result = await callOpenAI(prompt, options);

      expect(result).toEqual({
        success: true,
        content: 'Mock response',
        model: 'gpt-3.5-turbo',
        usage: { total_tokens: 10 },
        finishReason: undefined,
      });
    });

    it('should throw error when OPENAI_API_KEY is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(callOpenAI('test')).rejects.toThrow(
        'OPENAI_API_KEY environment variable is required'
      );
    });

    it('should throw error for invalid prompt', async () => {
      await expect(callOpenAI('')).rejects.toThrow(
        'Prompt must be a non-empty string'
      );

      await expect(callOpenAI(null)).rejects.toThrow(
        'Prompt must be a non-empty string'
      );
    });

    it('should throw error for invalid temperature', async () => {
      await expect(callOpenAI('test', { temperature: -1 })).rejects.toThrow(
        'Temperature must be between 0 and 2'
      );

      await expect(callOpenAI('test', { temperature: 3 })).rejects.toThrow(
        'Temperature must be between 0 and 2'
      );
    });

    it('should throw error for invalid maxTokens', async () => {
      await expect(callOpenAI('test', { maxTokens: 0 })).rejects.toThrow(
        'Max tokens must be between 1 and 4000'
      );

      await expect(callOpenAI('test', { maxTokens: 5000 })).rejects.toThrow(
        'Max tokens must be between 1 and 4000'
      );
    });
  });

  describe('completeText', () => {
    it('should return just the content string', async () => {
      const result = await completeText('Test prompt');
      expect(result).toBe('Mock response');
    });
  });

  describe('getStructuredResponse', () => {
    beforeEach(() => {
      // Reset the mock before each test
      jest.resetModules();
    });

    it('should parse JSON response', async () => {
      // Mock a JSON response
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: '{"key": "value"}' } }],
              model: 'gpt-3.5-turbo',
              usage: { total_tokens: 10 },
            }),
          },
        },
      }));

      const { getStructuredResponse } = require('../index');
      const result = await getStructuredResponse('Test prompt');
      expect(result).toEqual({ key: 'value' });
    });

    it('should throw error for invalid JSON', async () => {
      // Mock an invalid JSON response
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: 'Invalid JSON' } }],
              model: 'gpt-3.5-turbo',
              usage: { total_tokens: 10 },
            }),
          },
        },
      }));

      const { getStructuredResponse } = require('../index');
      await expect(getStructuredResponse('Test prompt')).rejects.toThrow(
        'Failed to parse JSON response'
      );
    });

    it('should parse JSON wrapped in markdown code blocks', async () => {
      // Mock a markdown-wrapped JSON response
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ 
                message: { 
                  content: '```json\n{"key": "value", "nested": {"test": 123}}\n```' 
                } 
              }],
              model: 'gpt-3.5-turbo',
              usage: { total_tokens: 10 },
            }),
          },
        },
      }));

      const { getStructuredResponse } = require('../index');
      const result = await getStructuredResponse('Test prompt');
      expect(result).toEqual({ key: 'value', nested: { test: 123 } });
    });

    it('should parse JSON wrapped in markdown code blocks without language specifier', async () => {
      // Mock a markdown-wrapped JSON response without json language specifier
      const mockOpenAI = require('openai');
      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ 
                message: { 
                  content: '```\n{"key": "value", "array": [1, 2, 3]}\n```' 
                } 
              }],
              model: 'gpt-3.5-turbo',
              usage: { total_tokens: 10 },
            }),
          },
        },
      }));

      const { getStructuredResponse } = require('../index');
      const result = await getStructuredResponse('Test prompt');
      expect(result).toEqual({ key: 'value', array: [1, 2, 3] });
    });
  });
}); 