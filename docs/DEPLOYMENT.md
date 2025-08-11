# Life OS Deployment Guide

This guide provides comprehensive instructions for deploying Life OS to various environments, from development to production.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Docker** (optional, for containerized deployment)

### Required Services
- **Supabase** account and project
- **OpenAI API** key (for AI features)
- **Sentry** account (for error monitoring)
- **Vercel** or **Netlify** account (for hosting)

### Optional Services
- **Cloudflare** (for CDN and DNS)
- **PostgreSQL** (if not using Supabase)
- **Redis** (for caching)
- **AWS S3** (for file storage)

## 🌍 Environment Setup

### Environment Variables

Create environment files for different environments:

#### `.env.local` (Development)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### `.env.production` (Production)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Application Configuration
NEXT_PUBLIC_APP_URL=https://lifeos.app
NODE_ENV=production

# Performance & Security
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Database Setup

#### Supabase Database Migration

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   supabase init
   ```

3. **Link to your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Run migrations**
   ```bash
   supabase db push
   ```

#### Manual Database Setup

If not using Supabase migrations:

```sql
-- Create tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  instructions TEXT[],
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add more tables as needed...
```

## 🏠 Local Development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/life-os.git
   cd life-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
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

## 🚀 Staging Deployment

### Vercel Staging Deployment

1. **Create staging environment**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add OPENAI_API_KEY
   ```

2. **Deploy to staging**
   ```bash
   vercel --env staging
   ```

3. **Set up staging domain**
   ```bash
   vercel domains add staging.lifeos.app
   ```

### Netlify Staging Deployment

1. **Create staging site**
   ```bash
   netlify sites:create --name life-os-staging
   ```

2. **Set environment variables**
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-supabase-url"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key"
   netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-service-role-key"
   netlify env:set OPENAI_API_KEY "your-openai-key"
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## 🌐 Production Deployment

### Vercel Production Deployment

1. **Configure production environment**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add OPENAI_API_KEY production
   vercel env add NEXT_PUBLIC_SENTRY_DSN production
   ```

2. **Deploy to production**
   ```bash
   vercel --prod
   ```

3. **Set up custom domain**
   ```bash
   vercel domains add lifeos.app
   ```

### Docker Production Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   # Install dependencies based on the preferred package manager
   COPY package.json package-lock.json* ./
   RUN npm ci --only=production

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   # Next.js collects completely anonymous telemetry data about general usage.
   # Learn more here: https://nextjs.org/telemetry
   # Uncomment the following line in case you want to disable telemetry during the build.
   ENV NEXT_TELEMETRY_DISABLED 1

   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public

   # Set the correct permission for prerender cache
   RUN mkdir .next
   RUN chown nextjs:nodejs .next

   # Automatically leverage output traces to reduce image size
   # https://nextjs.org/docs/advanced-features/output-file-tracing
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"

   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - OPENAI_API_KEY=${OPENAI_API_KEY}
       restart: unless-stopped
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Life OS

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
      
      - name: Run E2E tests
        run: npm run test:e2e

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Staging)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--env staging'

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Secrets

Set up the following secrets in your GitHub repository:

- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key

## 📊 Monitoring & Logging

### Sentry Integration

1. **Install Sentry SDK**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure Sentry**
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

3. **Add error boundaries**
   ```javascript
   import { ErrorBoundary } from '@sentry/nextjs';

   export default function App({ Component, pageProps }) {
     return (
       <ErrorBoundary fallback={<ErrorFallback />}>
         <Component {...pageProps} />
       </ErrorBoundary>
     );
   }
   ```

### Performance Monitoring

1. **Vercel Analytics**
   ```bash
   npm install @vercel/analytics
   ```

2. **Google Analytics**
   ```javascript
   // Add to _app.js
   import { GoogleAnalytics } from 'nextjs-google-analytics';

   export default function App({ Component, pageProps }) {
     return (
       <>
         <GoogleAnalytics trackPageViews />
         <Component {...pageProps} />
       </>
     );
   }
   ```

### Health Checks

Create `/api/health` endpoint:

```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
}
```

## ⚡ Performance Optimization

### Build Optimization

1. **Enable Next.js optimizations**
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['lucide-react', 'react-icons']
     },
     images: {
       domains: ['your-image-domain.com'],
       formats: ['image/webp', 'image/avif']
     },
     compress: true
   };
   ```

2. **Bundle analysis**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

3. **Add bundle analyzer**
   ```javascript
   // next.config.js
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true'
   });

   module.exports = withBundleAnalyzer({
     // your config
   });
   ```

### Caching Strategy

1. **Static assets caching**
   ```javascript
   // next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: '/static/:path*',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable'
             }
           ]
         }
       ];
     }
   };
   ```

2. **API response caching**
   ```javascript
   // API route with caching
   export default async function handler(req, res) {
     res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
     
     // Your API logic here
     res.json({ data: 'cached response' });
   }
   ```

## 🔒 Security Considerations

### Environment Variables

1. **Never commit sensitive data**
   ```bash
   # .gitignore
   .env*
   !.env.example
   ```

2. **Use strong secrets**
   ```bash
   # Generate strong secrets
   openssl rand -base64 32
   ```

3. **Rotate secrets regularly**
   - Update API keys quarterly
   - Rotate database passwords monthly
   - Review access permissions regularly

### Security Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ];
  }
};
```

### Database Security

1. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
   ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
   ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own meals" ON meals
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own meals" ON meals
     FOR INSERT WITH CHECK (auth.uid() = user_id);
   ```

2. **Input validation**
   ```javascript
   // Validate all inputs
   import { z } from 'zod';

   const mealSchema = z.object({
     name: z.string().min(1).max(100),
     prep_time: z.number().min(0).max(480),
     servings: z.number().min(1).max(50)
   });
   ```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Clear npm cache
npm cache clean --force
npm install
```

#### Database Connection Issues
```bash
# Check Supabase connection
supabase status

# Reset database
supabase db reset

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### Performance Issues
```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check Core Web Vitals
npm run lighthouse

# Monitor memory usage
node --inspect npm run dev
```

### Debug Mode

Enable debug logging:

```javascript
// Add to environment variables
NEXT_PUBLIC_ENABLE_DEBUG=true

// Use in code
if (process.env.NEXT_PUBLIC_ENABLE_DEBUG) {
  console.log('Debug info:', data);
}
```

### Support Resources

- **Documentation**: [https://docs.lifeos.app](https://docs.lifeos.app)
- **GitHub Issues**: [https://github.com/yourusername/life-os/issues](https://github.com/yourusername/life-os/issues)
- **Discord**: [https://discord.gg/lifeos](https://discord.gg/lifeos)
- **Email**: support@lifeos.app

---

**For more detailed deployment information, visit our [Deployment Documentation](https://docs.lifeos.app/deployment).**
