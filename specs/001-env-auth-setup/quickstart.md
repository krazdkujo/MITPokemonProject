# Quickstart: Environment and Test Auth Setup

**Feature**: 001-env-auth-setup
**Date**: 2026-01-03

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase project with API keys (already configured in `.env.local`)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file if not already done:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
NEXT_PUBLIC_ENABLE_TEST_AUTH=true
```

### 3. Run Database Migration

Execute the SQL migration in your Supabase dashboard:

1. Go to Supabase Dashboard > SQL Editor
2. Open `sql/001_create_users_table.sql`
3. Copy the contents and run in SQL Editor

Or use the Supabase CLI:

```bash
supabase db push
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Verification

### Check Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected"
  }
}
```

### Test Authentication

1. Navigate to `http://localhost:3000/test-auth`
2. Enter any email and name
3. Click "Login"
4. You should be redirected to the home page as an authenticated user

### Verify User Creation

Check your Supabase dashboard > Table Editor > users table to see the created user.

## Troubleshooting

### "Database connection error"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Check that your Supabase project is active

### "Test auth disabled"
- Set `NEXT_PUBLIC_ENABLE_TEST_AUTH=true` in `.env.local`
- Restart the development server

### "Missing environment variables"
- Check that `.env.local` exists and contains all required variables
- Restart the development server after changing environment variables

## Project Structure After Setup

```
pokemon-educational-platform/
├── .env.example          # Template for environment variables
├── .env.local            # Your local environment (gitignored)
├── pages/
│   ├── index.js          # Landing page
│   ├── test-auth.js      # Test auth screen
│   └── api/
│       ├── health.js     # Health check
│       └── auth/
│           └── test-login.js
├── components/
│   └── auth/
│       └── TestAuthForm.js
├── lib/
│   ├── supabase.js       # Supabase client
│   └── authContext.js    # Auth context provider
└── sql/
    └── 001_create_users_table.sql
```

## Next Steps

After completing this setup:

1. Verify all acceptance criteria from the spec are met
2. Proceed to implement game features using the established patterns
3. When ready for production, remove or disable test auth by unsetting
   `NEXT_PUBLIC_ENABLE_TEST_AUTH`
