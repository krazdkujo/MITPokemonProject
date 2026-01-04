/**
 * Authentication Helper
 *
 * Utilities for extracting user identity from session tokens
 * in API routes.
 */

import { createAdminClient } from './supabase';

/**
 * Extract user_id from session token
 *
 * For test auth, the token is a base64-encoded JSON with user_id.
 * For production JWT, this would decode and verify the JWT.
 *
 * @param {string} token - Session token (from Authorization header or cookie)
 * @returns {Object|null} Decoded session with user_id, or null if invalid
 */
export function decodeSessionToken(token) {
  if (!token) {
    return null;
  }

  try {
    // Remove "Bearer " prefix if present
    const cleanToken = token.startsWith('Bearer ')
      ? token.slice(7)
      : token;

    // Decode base64 token (test auth format)
    const decoded = Buffer.from(cleanToken, 'base64').toString('utf8');
    const session = JSON.parse(decoded);

    if (!session.user_id) {
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to decode session token:', error);
    return null;
  }
}

/**
 * Get user_id from request headers or cookies
 *
 * @param {Object} req - Next.js request object
 * @returns {string|null} user_id or null if not authenticated
 */
export function getUserIdFromRequest(req) {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const session = decodeSessionToken(authHeader);
    return session?.user_id || null;
  }

  // Try session cookie
  const sessionCookie = req.cookies?.session;
  if (sessionCookie) {
    const session = decodeSessionToken(sessionCookie);
    return session?.user_id || null;
  }

  return null;
}

/**
 * Verify user exists in database and return user record
 *
 * @param {string} userId - User ID to verify
 * @returns {Object|null} User record or null if not found
 */
export async function verifyUser(userId) {
  if (!userId) {
    return null;
  }

  try {
    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Failed to verify user:', error);
    return null;
  }
}

/**
 * Middleware-style function to authenticate request
 * Returns user_id if valid, or null with error details
 *
 * @param {Object} req - Next.js request object
 * @returns {Object} { userId: string|null, error: string|null }
 */
export async function authenticateRequest(req) {
  const userId = getUserIdFromRequest(req);

  if (!userId) {
    return {
      userId: null,
      error: 'No authentication token provided'
    };
  }

  const user = await verifyUser(userId);

  if (!user) {
    return {
      userId: null,
      error: 'Invalid or expired session'
    };
  }

  return { userId, error: null };
}
