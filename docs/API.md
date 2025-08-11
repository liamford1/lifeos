# Life OS API Documentation

This document provides comprehensive documentation for the Life OS API endpoints, authentication, and integration guidelines.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Calendar Management](#calendar-management)
  - [Fitness Tracking](#fitness-tracking)
  - [Meal Management](#meal-management)
  - [Financial Management](#financial-management)
  - [AI Services](#ai-services)
- [WebSocket Events](#websocket-events)
- [Data Models](#data-models)
- [Examples](#examples)

## 🔐 Authentication

Life OS uses Supabase authentication with JWT tokens. All API requests require authentication unless explicitly noted.

### Authentication Methods

1. **Bearer Token** (Recommended)
   ```http
   Authorization: Bearer <your-jwt-token>
   ```

2. **Cookie-based** (Fallback)
   ```http
   Cookie: sb-access-token=<your-jwt-token>
   ```

### Getting a Token

```javascript
import { supabase } from '@/lib/supabaseClient';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

## 🌐 Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://lifeos.app/api`

## ⚠️ Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)",
  "code": "ERROR_CODE (optional)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

### Common Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_INPUT` - Invalid request data
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `VALIDATION_ERROR` - Data validation failed

## 🚦 Rate Limiting

- **Standard Endpoints**: 100 requests per minute
- **AI Endpoints**: 10 requests per minute
- **Authentication**: 5 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📡 Endpoints

### Authentication Endpoints

#### Get Current User
```http
GET /api/auth/user
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Refresh Session
```http
POST /api/auth/refresh
```

**Response:**
```json
{
  "session": {
    "access_token": "new-jwt-token",
    "refresh_token": "refresh-token",
    "expires_at": 1640995200
  }
}
```

### Calendar Management

#### List Calendar Events
```http
GET /api/calendar/list?start_date=2024-01-01&end_date=2024-01-31
```

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `source` (optional): Filter by event source (meal, workout, cardio, etc.)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Workout Session",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T11:00:00Z",
      "source": "workout",
      "source_id": "workout-uuid",
      "user_id": "user-uuid",
      "created_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

#### Create Calendar Event
```http
POST /api/calendar/insert
```

**Request Body:**
```json
{
  "title": "Workout Session",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "source": "workout",
  "source_id": "workout-uuid",
  "linked_entity": true
}
```

#### Update Calendar Event
```http
POST /api/calendar/update
```

**Request Body:**
```json
{
  "id": "event-uuid",
  "user_id": "user-uuid",
  "new_start": "2024-01-15T11:00:00Z",
  "new_end": "2024-01-15T12:00:00Z",
  "update_linked_entity": true
}
```

#### Delete Calendar Event
```http
POST /api/calendar/delete
```

**Request Body:**
```json
{
  "id": "event-uuid"
}
```

### Fitness Tracking

#### List Workouts
```http
GET /api/fitness/workouts?user_id=uuid&limit=10&offset=0
```

**Query Parameters:**
- `user_id` (required): User ID
- `limit` (optional): Number of records to return (default: 10)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "workouts": [
    {
      "id": "uuid",
      "name": "Upper Body Workout",
      "date": "2024-01-15",
      "duration_minutes": 60,
      "notes": "Great session today",
      "user_id": "user-uuid",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25,
  "has_more": true
}
```

#### Create Workout
```http
POST /api/fitness/workouts
```

**Request Body:**
```json
{
  "name": "Upper Body Workout",
  "date": "2024-01-15",
  "duration_minutes": 60,
  "notes": "Great session today",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": 3,
      "reps": 10,
      "weight": 135
    }
  ]
}
```

#### List Cardio Sessions
```http
GET /api/fitness/cardio?user_id=uuid
```

#### Create Cardio Session
```http
POST /api/fitness/cardio
```

**Request Body:**
```json
{
  "activity_type": "running",
  "date": "2024-01-15",
  "duration_minutes": 30,
  "distance_miles": 3.1,
  "calories_burned": 300,
  "notes": "Morning run"
}
```

### Meal Management

#### List Meals
```http
GET /api/meals?user_id=uuid
```

#### Create Meal
```http
POST /api/meals
```

**Request Body:**
```json
{
  "name": "Grilled Chicken Salad",
  "description": "Healthy salad with grilled chicken",
  "prep_time": 15,
  "cook_time": 20,
  "servings": 2,
  "instructions": ["Grill chicken", "Prepare salad", "Combine ingredients"],
  "ingredients": [
    {
      "food_item_name": "chicken breast",
      "quantity": 200,
      "unit": "g"
    }
  ]
}
```

#### List Pantry Items
```http
GET /api/pantry?user_id=uuid
```

#### Add Pantry Item
```http
POST /api/pantry
```

**Request Body:**
```json
{
  "name": "chicken breast",
  "quantity": 500,
  "unit": "g",
  "expiry_date": "2024-01-20"
}
```

### Financial Management

#### List Expenses
```http
GET /api/finances/expenses?user_id=uuid&start_date=2024-01-01&end_date=2024-01-31
```

#### Create Expense
```http
POST /api/finances/expenses
```

**Request Body:**
```json
{
  "name": "Grocery Shopping",
  "amount": 85.50,
  "category": "food",
  "store": "Whole Foods",
  "payment_method": "credit_card",
  "date": "2024-01-15",
  "notes": "Weekly groceries"
}
```

#### List Receipts
```http
GET /api/finances/receipts?user_id=uuid
```

#### Upload Receipt
```http
POST /api/finances/receipts
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Receipt image file
- `store`: Store name
- `date`: Purchase date
- `amount`: Total amount

### AI Services

#### Get Meal Suggestions
```http
POST /api/ai/meal-suggestions
```

**Request Body:**
```json
{
  "pantry_items": [
    {
      "name": "chicken breast",
      "quantity": 500,
      "unit": "g"
    }
  ],
  "preferences": {
    "cuisine": "healthy",
    "max_prep_time": 30,
    "dietary_restrictions": ["low-carb"]
  },
  "dietary_restrictions": ["vegetarian"]
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "id": "suggestion-1",
      "name": "Grilled Chicken with Vegetables",
      "description": "Healthy grilled chicken with seasonal vegetables",
      "ingredients": [
        {
          "name": "chicken breast",
          "quantity": 200,
          "unit": "g"
        }
      ],
      "prep_time": 10,
      "cook_time": 20,
      "difficulty": "easy",
      "instructions": ["Season chicken", "Grill for 20 minutes"],
      "estimated_servings": 2,
      "missing_ingredients": []
    }
  ],
  "pantry_items": 1,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

#### Get Workout Suggestions
```http
POST /api/ai/workout-suggestions
```

**Request Body:**
```json
{
  "fitness_level": "intermediate",
  "goals": ["strength", "endurance"],
  "available_equipment": ["dumbbells", "bench"],
  "time_available": 45,
  "previous_workouts": ["upper_body", "cardio"]
}
```

## 🔌 WebSocket Events

Life OS provides real-time updates via WebSocket connections.

### Connection
```javascript
const socket = new WebSocket('wss://lifeos.app/ws');
```

### Event Types

#### Calendar Updates
```json
{
  "type": "calendar:update",
  "data": {
    "event_id": "uuid",
    "action": "created|updated|deleted",
    "event": { /* event data */ }
  }
}
```

#### Fitness Session Updates
```json
{
  "type": "fitness:session:update",
  "data": {
    "session_id": "uuid",
    "status": "active|paused|completed",
    "progress": 75
  }
}
```

#### Meal Cooking Updates
```json
{
  "type": "meal:cooking:update",
  "data": {
    "meal_id": "uuid",
    "current_step": 3,
    "total_steps": 5,
    "time_remaining": 300
  }
}
```

## 📊 Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    preferences?: UserPreferences;
  };
}
```

### Calendar Event
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string;
  source: 'meal' | 'workout' | 'cardio' | 'sport' | 'expense';
  source_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

### Workout
```typescript
interface Workout {
  id: string;
  name: string;
  date: string;
  duration_minutes: number;
  notes?: string;
  exercises: Exercise[];
  user_id: string;
  created_at: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
}

interface Set {
  id: string;
  reps: number;
  weight?: number;
  duration?: number;
  distance?: number;
}
```

### Meal
```typescript
interface Meal {
  id: string;
  name: string;
  description?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  instructions: string[];
  ingredients: Ingredient[];
  user_id: string;
  created_at: string;
}

interface Ingredient {
  id: string;
  food_item_name: string;
  quantity: number;
  unit: string;
}
```

## 💡 Examples

### Complete Workflow Example

```javascript
// 1. Authenticate
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// 2. Get meal suggestions
const suggestions = await fetch('/api/ai/meal-suggestions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pantry_items: [
      { name: 'chicken breast', quantity: 500, unit: 'g' }
    ],
    preferences: { cuisine: 'healthy' }
  })
});

// 3. Create a meal
const meal = await fetch('/api/meals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Grilled Chicken Salad',
    prep_time: 15,
    cook_time: 20,
    servings: 2,
    instructions: ['Grill chicken', 'Prepare salad'],
    ingredients: [
      { food_item_name: 'chicken breast', quantity: 200, unit: 'g' }
    ]
  })
});

// 4. Create calendar event
const event = await fetch('/api/calendar/insert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Dinner: Grilled Chicken Salad',
    start_time: '2024-01-15T18:00:00Z',
    source: 'meal',
    source_id: meal.id,
    linked_entity: true
  })
});
```

### Error Handling Example

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## 🔧 SDK and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @lifeos/sdk
```

```javascript
import { LifeOS } from '@lifeos/sdk';

const client = new LifeOS({
  apiKey: 'your-api-key',
  baseUrl: 'https://lifeos.app/api'
});

// Use the SDK
const meals = await client.meals.list();
const suggestions = await client.ai.getMealSuggestions(pantryItems);
```

### React Hooks

```javascript
import { useMeals, useWorkouts, useCalendar } from '@lifeos/react';

function MyComponent() {
  const { meals, loading, error } = useMeals();
  const { workouts } = useWorkouts();
  const { events } = useCalendar();

  // Component logic
}
```

## 📞 Support

For API support and questions:

- **Documentation**: [https://docs.lifeos.app/api](https://docs.lifeos.app/api)
- **GitHub Issues**: [https://github.com/yourusername/life-os/issues](https://github.com/yourusername/life-os/issues)
- **Email**: api-support@lifeos.app
- **Discord**: [https://discord.gg/lifeos](https://discord.gg/lifeos)

---

**For the latest API updates, check our [API Changelog](https://docs.lifeos.app/api/changelog).**
