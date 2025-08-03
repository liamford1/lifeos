# AI Module

This module provides a clean interface for calling the OpenAI API with comprehensive error handling and configuration options.

## Setup

1. Install the OpenAI package:
```bash
npm install openai
```

2. Set your OpenAI API key as an environment variable:
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

## Usage

### Basic Usage

```javascript
import { callOpenAI } from '@/lib/ai';

// Simple text completion
const response = await callOpenAI('What is the capital of France?');
console.log(response.content); // "The capital of France is Paris."
```

### Advanced Configuration

```javascript
const response = await callOpenAI('Write a short story about a robot.', {
  systemPrompt: 'You are a creative writer who specializes in science fiction.',
  temperature: 0.8,
  maxTokens: 500,
  model: 'gpt-4',
  timeout: 60000,
});
```

### Helper Functions

#### Simple Text Completion
```javascript
import { completeText } from '@/lib/ai';

const text = await completeText('Complete this sentence: The weather is...');
console.log(text); // "The weather is beautiful today."
```

#### Structured JSON Responses
```javascript
import { getStructuredResponse } from '@/lib/ai';

const data = await getStructuredResponse(
  'List 3 fruits with their colors',
  {
    systemPrompt: 'Respond with a JSON array of objects with "name" and "color" properties.'
  }
);
console.log(data);
// [
//   { "name": "apple", "color": "red" },
//   { "name": "banana", "color": "yellow" },
//   { "name": "grape", "color": "purple" }
// ]
```

#### Streaming Responses
```javascript
import { streamResponse } from '@/lib/ai';

await streamResponse(
  'Write a long story about space exploration.',
  (chunk) => {
    console.log(chunk); // Each piece of the response as it arrives
  },
  { maxTokens: 2000 }
);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `systemPrompt` | string | null | System prompt to set context |
| `temperature` | number | 0.7 | Controls randomness (0-2) |
| `maxTokens` | number | 1000 | Maximum tokens in response |
| `model` | string | 'gpt-3.5-turbo' | OpenAI model to use |
| `timeout` | number | 30000 | Request timeout in milliseconds |
| `stream` | boolean | false | Whether to stream the response |
| `retries` | number | 3 | Number of retry attempts |
| `retryDelay` | number | 1000 | Delay between retries in milliseconds |

## Error Handling

The module handles various error scenarios:

- **Rate Limiting**: Automatic retry with exponential backoff
- **Authentication**: Clear error messages for invalid API keys
- **Network Issues**: Timeout handling and retry logic
- **Server Errors**: Automatic retry for 5xx errors
- **Validation**: Input parameter validation

## Response Format

### Standard Response
```javascript
{
  success: true,
  content: "The AI response text",
  model: "gpt-3.5-turbo",
  usage: {
    total_tokens: 150,
    prompt_tokens: 50,
    completion_tokens: 100
  },
  finishReason: "stop"
}
```

### Streaming Response
```javascript
{
  success: true,
  stream: AsyncIterable,
  model: "gpt-3.5-turbo",
  usage: null // Not available for streaming
}
```

## Examples for Life Management Platform

### Meal Planning
```javascript
const mealPlan = await getStructuredResponse(
  `Based on these ingredients: ${ingredients.join(', ')}, 
   suggest 3 meals for this week.`,
  {
    systemPrompt: 'You are a nutritionist. Respond with JSON containing meal suggestions with name, ingredients, and instructions.',
    temperature: 0.3
  }
);
```

### Workout Recommendations
```javascript
const workout = await callOpenAI(
  `I have 30 minutes and want to work on ${muscleGroup}. 
   I'm ${fitnessLevel} level. Suggest a workout.`,
  {
    systemPrompt: 'You are a personal trainer. Provide structured workout recommendations.',
    maxTokens: 800
  }
);
```

### Expense Categorization
```javascript
const category = await completeText(
  `Categorize this expense: ${expenseDescription}`,
  {
    systemPrompt: 'You are a financial advisor. Respond with only the category name.',
    temperature: 0.1,
    maxTokens: 50
  }
);
```

## Testing

Run the tests to ensure the module works correctly:

```bash
npm test src/lib/ai/__tests__/index.test.js
```

## Security Notes

- Never expose your API key in client-side code
- Use environment variables for API keys
- Consider implementing rate limiting on your application level
- Monitor API usage to control costs 