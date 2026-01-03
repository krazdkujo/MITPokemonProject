import { createClient } from '@supabase/supabase-js';

// Environment variable validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please copy .env.example to .env.local and fill in your Supabase credentials.';

  // In browser, log error but don't crash immediately
  if (typeof window !== 'undefined') {
    console.error(errorMessage);
  } else {
    // On server, throw to prevent startup with missing config
    throw new Error(errorMessage);
  }
}

// Create Supabase client for browser/client-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Create Supabase admin client for server-side operations
// This client bypasses RLS - use only in API routes
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_KEY environment variable. ' +
      'This is required for server-side operations.'
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Helper to check if environment is properly configured
export function isConfigured() {
  return missingVars.length === 0;
}

// Get list of missing environment variables
export function getMissingEnvVars() {
  return missingVars;
}
