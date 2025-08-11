# 🚀 Life OS - AI-Powered Life Management Platform

> **Your personal AI assistant for comprehensive life management - from fitness tracking to meal planning, financial management, and productivity optimization.**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Real--time%20Database-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT%20Integration-purple?style=for-the-badge&logo=openai)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 📖 Overview

Life OS is a comprehensive, AI-powered life management platform that seamlessly integrates fitness tracking, meal planning, financial management, and productivity tools into a unified dashboard. Built with modern web technologies and enhanced with OpenAI's GPT integration, Life OS provides intelligent insights and recommendations to help users optimize every aspect of their daily lives.

The platform features a sophisticated calendar system that automatically syncs activities across all life domains, AI-powered meal suggestions based on available ingredients and dietary preferences, real-time fitness tracking with detailed analytics, and comprehensive financial management tools. With its intuitive interface and powerful automation capabilities, Life OS transforms how users approach personal productivity and wellness management.

Whether you're a fitness enthusiast looking to optimize your workout routines, a busy professional seeking better meal planning solutions, or someone wanting to gain better control over their finances, Life OS provides the tools and insights needed to achieve your goals efficiently and intelligently.

## ✨ Key Features

### 🏃‍♂️ **Fitness & Wellness Management**
- **Comprehensive Workout Tracking**: Log workouts, cardio sessions, sports activities, and stretching routines
- **Real-time Session Management**: Live workout tracking with progress monitoring
- **Exercise Library**: Extensive database of exercises with detailed instructions
- **Performance Analytics**: Track progress over time with detailed statistics and trends
- **AI-Powered Recommendations**: Get personalized workout suggestions based on your goals and history

### 🍽️ **AI-Enhanced Meal Planning**
- **Smart Meal Suggestions**: AI-powered recipe recommendations based on available ingredients
- **Pantry Management**: Track inventory and get suggestions for meals you can make
- **Meal Planning Calendar**: Schedule meals and automatically sync with your calendar
- **Cooking Session Tracking**: Step-by-step cooking guidance with timer integration
- **Nutritional Insights**: Detailed nutritional information and dietary restriction support

### 💰 **Financial Management**
- **Expense Tracking**: Categorize and track all expenses with detailed analytics
- **Receipt Management**: Digital receipt storage with automatic categorization
- **Budget Planning**: Set and monitor budgets across different categories
- **Financial Reports**: Comprehensive financial insights and spending patterns
- **Calendar Integration**: Financial events automatically sync with your calendar

### 📅 **Intelligent Calendar System**
- **Cross-Domain Integration**: All activities automatically sync across fitness, meals, and finances
- **Drag-and-Drop Interface**: Intuitive event management with real-time updates
- **Smart Scheduling**: AI-assisted scheduling based on your patterns and preferences
- **Event Linking**: Related activities are automatically linked and updated together
- **Mobile Responsive**: Full functionality across all devices

### 🤖 **AI-Powered Intelligence**
- **OpenAI GPT Integration**: Advanced AI recommendations for meals, workouts, and productivity
- **Personalized Insights**: Learn from your patterns to provide better suggestions
- **Natural Language Processing**: Interact with the system using natural language
- **Predictive Analytics**: Anticipate needs based on historical data and patterns
- **Smart Automation**: Automate routine tasks and decision-making processes

## 🛠️ Technology Stack

### **Frontend**
- **[Next.js 15.3.5](https://nextjs.org/)** - React framework with server-side rendering and API routes
- **[React 19](https://reactjs.org/)** - Modern React with latest features and optimizations
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Tailwind CSS 3.0](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Query (TanStack Query)](https://tanstack.com/query)** - Powerful data fetching and caching
- **[Lucide React](https://lucide.dev/)** - Beautiful, customizable icons
- **[React Icons](https://react-icons.github.io/react-icons/)** - Comprehensive icon library

### **Backend & Database**
- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative
  - **PostgreSQL Database** - Robust relational database
  - **Real-time Subscriptions** - Live data synchronization
  - **Row Level Security** - Advanced security policies
  - **Authentication** - Built-in user management
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless API endpoints

### **AI & External Services**
- **[OpenAI GPT-4](https://openai.com/)** - Advanced AI for meal suggestions and insights
- **[Sentry](https://sentry.io/)** - Error monitoring and performance tracking

### **Development Tools**
- **[ESLint](https://eslint.org/)** - Code linting and quality enforcement
- **[Jest](https://jestjs.io/)** - Comprehensive testing framework
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Component testing
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Supabase** account (free tier available)
- **OpenAI API** key (optional, for AI features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/life-os.git
   cd life-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # OpenAI Configuration (Optional)
   OPENAI_API_KEY=your_openai_api_key
   
   # Sentry Configuration (Optional)
   SENTRY_DSN=your_sentry_dsn
   ```

4. **Database Setup**
   ```bash
   # Run the database migration script
   npm run db:setup
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

## 📱 Usage Examples

### AI-Powered Meal Planning
```javascript
// Get meal suggestions based on available ingredients
const suggestions = await getMealSuggestions([
  { name: 'chicken breast', quantity: 500, unit: 'g' },
  { name: 'rice', quantity: 200, unit: 'g' },
  { name: 'vegetables', quantity: 300, unit: 'g' }
], {
  cuisine: 'healthy',
  maxPrepTime: 30,
  dietaryRestrictions: ['low-carb']
});
```

### Fitness Session Tracking
```javascript
// Start a live workout session
const session = await startWorkoutSession({
  workoutId: 'workout-123',
  exercises: [
    { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
    { name: 'Squats', sets: 3, reps: 12, weight: 185 }
  ]
});
```

### Calendar Integration
```javascript
// Create a calendar event that links to a meal
const event = await createCalendarEvent({
  title: 'Dinner: Grilled Chicken',
  startTime: '2024-01-15T18:00:00Z',
  source: 'meal',
  sourceId: 'meal-456',
  linkedEntity: true
});
```

## 🔌 API Documentation

### Core Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

#### Calendar Management
- `GET /api/calendar/list` - List calendar events
- `POST /api/calendar/insert` - Create new event
- `POST /api/calendar/update` - Update existing event
- `POST /api/calendar/delete` - Delete event

#### AI Services
- `POST /api/ai/meal-suggestions` - Get AI meal recommendations
- `POST /api/ai/workout-suggestions` - Get AI workout recommendations

#### Fitness Tracking
- `GET /api/fitness/workouts` - List workouts
- `POST /api/fitness/workouts` - Create workout
- `GET /api/fitness/cardio` - List cardio sessions
- `POST /api/fitness/cardio` - Create cardio session

#### Meal Management
- `GET /api/meals` - List meals
- `POST /api/meals` - Create meal
- `GET /api/pantry` - List pantry items
- `POST /api/pantry` - Add pantry item

### WebSocket Events
- `calendar:update` - Real-time calendar updates
- `fitness:session:update` - Live fitness session updates
- `meal:cooking:update` - Cooking session progress

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PRs
- Use TypeScript for all new code
- Follow React best practices and hooks guidelines

### Issue Reporting
- Use the GitHub issue tracker
- Provide detailed reproduction steps
- Include browser/device information
- Attach relevant screenshots or logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Life OS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 👨‍💻 Author & Contact

**Life OS Development Team**

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Email**: contact@lifeos.app
- **Website**: [https://lifeos.app](https://lifeos.app)
- **Documentation**: [https://docs.lifeos.app](https://docs.lifeos.app)

### Support & Community
- **Discord**: [Join our community](https://discord.gg/lifeos)
- **Twitter**: [@LifeOS_App](https://twitter.com/LifeOS_App)
- **Blog**: [https://blog.lifeos.app](https://blog.lifeos.app)

---

<div align="center">

**Made with ❤️ by the Life OS Team**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/life-os?style=social)](https://github.com/yourusername/life-os/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/life-os?style=social)](https://github.com/yourusername/life-os/network)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/life-os)](https://github.com/yourusername/life-os/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/life-os)](https://github.com/yourusername/life-os/pulls)

</div>
