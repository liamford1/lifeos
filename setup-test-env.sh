#!/bin/bash

# Test Environment Setup Script
echo "🔧 Setting up test environment for PlannerApp..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration (for AI meal suggestions)
OPENAI_API_KEY=your_openai_api_key_here

# Sentry Configuration (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Test Configuration
NODE_ENV=development
EOF
    echo "✅ Created .env.local file"
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Check if required environment variables are set
echo "🔍 Checking environment variables..."

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ "$NEXT_PUBLIC_SUPABASE_URL" = "your_supabase_project_url_here" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not set or using placeholder"
    echo "   Please update .env.local with your Supabase project URL"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" = "your_supabase_anon_key_here" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not set or using placeholder"
    echo "   Please update .env.local with your Supabase anon key"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_supabase_service_role_key_here" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not set or using placeholder"
    echo "   Please update .env.local with your Supabase service role key"
fi

echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual Supabase credentials"
echo "2. Run: npm run test:e2e"
echo ""
echo "🔗 Get your Supabase credentials from: https://supabase.com/dashboard"
echo "   - Go to your project settings"
echo "   - Copy the Project URL and API keys" 