# KENYA REALTORS - Property Management & Leasing Platform

A comprehensive React + TypeScript + Supabase platform for property management, tenant management, and rental payments in Kenya.

## 🎯 Features

- **Property Management**: Manage properties, units, and availability
- **Tenant Portal**: Rent payments, maintenance requests, document management
- **Manager Dashboard**: Property allocation, tenant management, payment tracking
- **Super Admin Dashboard**: System analytics, approval queue, user management
- **Payment Integration**: Stripe & Paystack integration for rent collection
- **Approval Workflow**: Multi-step approval system for property and user operations
- **Real-time Notifications**: Socket-based real-time updates

## 📁 Project Structure

```
src/
├── components/        # React components (UI, layout, portals)
├── pages/            # Page components and routes
├── contexts/         # React context (Auth, Theme, Approvals)
├── hooks/            # Custom React hooks
├── services/         # API and service layer
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and helpers
├── integrations/     # Third-party integrations (Supabase)
└── lib/             # Library utilities and constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp src/.env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔑 Environment Variables

See `.env.example` in the root directory for required environment variables.

### Local Development
1. Copy the template: `cp .env.example .env.local`
2. Fill in your actual API keys and credentials
3. **IMPORTANT**: Never commit `.env` or `.env.local` to version control (`.gitignore` already excludes these)

### Netlify Deployment
1. Go to **Netlify Dashboard** → **Site settings** → **Build & deploy** → **Environment**
2. Add environment variables for production:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_PAYSTACK_PUBLIC_KEY`
   - `VITE_PAYSTACK_SECRET_KEY`
   - `VITE_PAYSTACK_PLAN_INTERMEDIATE`
   - `VITE_PAYSTACK_PLAN_PROFESSIONAL`
   - `VITE_APP_URL`

3. Trigger a new deploy to apply the environment variables

⚠️ **Security**: Never hardcode secrets in source code or commit `.env` files. All secrets should be configured in your deployment platform's environment variables.

## 📦 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Form Management**: React Hook Form + Zod
- **State Management**: React Context + TanStack Query
- **Payments**: Stripe & Paystack
- **Animations**: Framer Motion

## 🧪 Code Quality

- **Linting**: ESLint with TypeScript support
- **Build**: Vite with optimized chunking
- **Type Safety**: Strict TypeScript configuration

Run linting:
```bash
npm run lint
```

## 📝 License

© 2025 KENYA REALTORS. All rights reserved.

## 🤝 Support

For issues and questions, please contact the development team.
