import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Call OpenAI API with the given prompt and options
 * @param {string} prompt - The user prompt to send to OpenAI
 * @param {Object} options - Configuration options
 * @param {string} [options.systemPrompt] - System prompt to set context
 * @param {number} [options.temperature=0.7] - Controls randomness (0-2)
 * @param {number} [options.maxTokens=1000] - Maximum tokens in response
 * @param {string} [options.model='gpt-3.5-turbo'] - OpenAI model to use
 * @param {number} [options.timeout=30000] - Request timeout in milliseconds
 * @param {boolean} [options.stream=false] - Whether to stream the response
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {number} [options.retryDelay=1000] - Delay between retries in milliseconds
 * @returns {Promise<Object>} - Response object with content and metadata
 */
export async function callOpenAI(prompt, options = {}) {
  const {
    systemPrompt = null,
    temperature = 0.7,
    maxTokens = 1000,
    model = 'gpt-3.5-turbo',
    timeout = 30000,
    stream = false,
    retries = 3,
    retryDelay = 1000,
  } = options;

  // Validate required environment variable
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  // Validate input parameters
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt must be a non-empty string');
  }

  if (temperature < 0 || temperature > 2) {
    throw new Error('Temperature must be between 0 and 2');
  }

  if (maxTokens < 1 || maxTokens > 4000) {
    throw new Error('Max tokens must be between 1 and 4000');
  }

  // Build messages array
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  // Create request configuration
  const requestConfig = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream,
  };

  // Retry logic with exponential backoff
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await openai.chat.completions.create(requestConfig, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle streaming response
      if (stream) {
        return {
          success: true,
          stream: response,
          model: response.model,
          usage: response.usage,
        };
      }

      // Handle regular response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return {
        success: true,
        content,
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason,
      };

    } catch (error) {
      lastError = error;
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }

      if (error.status === 429) {
        // Rate limit error
        const retryAfter = error.headers?.['retry-after'] || retryDelay;
        console.warn(`Rate limited. Retrying after ${retryAfter}ms (attempt ${attempt}/${retries})`);
        
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your OPENAI_API_KEY environment variable.');
      }

      if (error.status === 403) {
        throw new Error('Access denied. Please check your OpenAI account and billing status.');
      }

      if (error.status >= 500) {
        // Server error, retry
        console.warn(`Server error (${error.status}). Retrying in ${retryDelay}ms (attempt ${attempt}/${retries})`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // For other errors, don't retry
      break;
    }
  }

  // If we get here, all retries failed
  throw new Error(`OpenAI API call failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Helper function for simple text completions
 * @param {string} prompt - The prompt to complete
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} - The completed text
 */
export async function completeText(prompt, options = {}) {
  const response = await callOpenAI(prompt, options);
  return response.content;
}

/**
 * Helper function for structured JSON responses
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function getStructuredResponse(prompt, options = {}) {
  const systemPrompt = options.systemPrompt || 
    'You must respond with valid JSON only. Do not include any other text or formatting.';
  
  const response = await callOpenAI(prompt, {
    ...options,
    systemPrompt,
    temperature: options.temperature || 0.1, // Lower temperature for more consistent JSON
  });

  try {
    // First try to parse the response directly
    return JSON.parse(response.content);
  } catch (error) {
    // If direct parsing fails, try to extract JSON from markdown code blocks
    const content = response.content.trim();
    
    // Check if the response is wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (markdownError) {
        throw new Error(`Failed to parse JSON from markdown: ${markdownError.message}. Response: ${response.content}`);
      }
    }
    
    // If no markdown blocks found, throw the original error
    throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${response.content}`);
  }
}

/**
 * Helper function for streaming responses
 * @param {string} prompt - The prompt to send
 * @param {Function} onChunk - Callback function for each chunk
 * @param {Object} options - Configuration options
 * @returns {Promise<void>}
 */
export async function streamResponse(prompt, onChunk, options = {}) {
  const response = await callOpenAI(prompt, {
    ...options,
    stream: true,
  });

  for await (const chunk of response.stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      onChunk(content);
    }
  }
} 