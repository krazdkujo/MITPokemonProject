import { supabase, isConfigured, getMissingEnvVars } from '../../lib/supabase';
import { sendSuccess, sendError, sendMethodNotAllowed } from '../../lib/apiResponse';

/**
 * GET /api/health
 *
 * Health check endpoint to verify the application and database connection.
 * Returns status of application and database connectivity.
 */
export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  const timestamp = new Date().toISOString();

  // Check environment configuration
  if (!isConfigured()) {
    const missingVars = getMissingEnvVars();
    return sendError(
      res,
      'CONFIGURATION_ERROR',
      'Application is not properly configured',
      503,
      {
        missing_variables: missingVars.join(', '),
        hint: 'Copy .env.example to .env.local and fill in your Supabase credentials',
      }
    );
  }

  // Test database connection
  try {
    // Simple query to verify database connectivity
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      // Check if error is due to missing table (expected on first run before migration)
      // 42P01 = PostgreSQL "undefined_table", PGRST205 = PostgREST "could not find table"
      if (error.code === '42P01' || error.code === 'PGRST205' || error.message.includes('does not exist')) {
        return sendSuccess(res, {
          status: 'healthy',
          database: 'connected',
          tables: 'not_initialized',
          message: 'Database connected but users table does not exist. Run the SQL migration from sql/001_create_users_table.sql',
          timestamp,
        });
      }

      // Other database errors
      console.error('Database health check error:', error);
      return sendError(
        res,
        'DATABASE_CONNECTION_ERROR',
        'Unable to connect to database. Check your Supabase configuration.',
        503,
        {
          hint: 'Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly',
          error_code: error.code,
        }
      );
    }

    // All checks passed
    return sendSuccess(res, {
      status: 'healthy',
      database: 'connected',
      tables: 'initialized',
      timestamp,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return sendError(
      res,
      'DATABASE_CONNECTION_ERROR',
      'Unable to connect to database. Check your Supabase configuration.',
      503,
      {
        hint: 'Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly',
      }
    );
  }
}
