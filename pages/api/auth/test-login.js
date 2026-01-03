import { createAdminClient } from '../../../lib/supabase';
import {
  sendSuccess,
  sendValidationError,
  sendError,
  sendInternalError,
  sendMethodNotAllowed,
} from '../../../lib/apiResponse';

/**
 * POST /api/auth/test-login
 *
 * Test authentication endpoint for development.
 * Creates or retrieves a user and establishes a session.
 *
 * Only available when NEXT_PUBLIC_ENABLE_TEST_AUTH=true
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return sendMethodNotAllowed(res, ['POST']);
  }

  // Check if test auth is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH !== 'true') {
    return sendError(
      res,
      'TEST_AUTH_DISABLED',
      'Test authentication is not enabled in this environment',
      403,
      { hint: 'Set NEXT_PUBLIC_ENABLE_TEST_AUTH=true in your environment' }
    );
  }

  try {
    const { email, name } = req.body;

    // Validate request body
    const validationErrors = {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!isValidEmail(email.trim())) {
      validationErrors.email = 'Must be a valid email address';
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      validationErrors.name = 'Name is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      return sendValidationError(
        res,
        'Invalid request data',
        validationErrors
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    // Create admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: lookupError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    let user;
    let isNewUser = false;

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = "not found", which is expected for new users
      console.error('User lookup error:', lookupError);
      return sendInternalError(res, 'Failed to check for existing user');
    }

    if (existingUser) {
      // User exists, use existing record
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: normalizedEmail,
          name: normalizedName,
        })
        .select()
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return sendInternalError(res, 'Failed to create user');
      }

      user = newUser;
      isNewUser = true;
    }

    // For test auth, we create a simple session token
    // In production, this would be replaced with proper JWT handling
    const sessionToken = Buffer.from(
      JSON.stringify({
        user_id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
      })
    ).toString('base64');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      session: {
        access_token: sessionToken,
        expires_at: expiresAt,
      },
      is_new_user: isNewUser,
    });
  } catch (error) {
    console.error('Test login error:', error);
    return sendInternalError(res, 'An unexpected error occurred during authentication');
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
