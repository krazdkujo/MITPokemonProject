/**
 * Authenticated Fetch Helper
 *
 * Wrapper around fetch that automatically includes the session token
 * from localStorage in the Authorization header.
 */

const TEST_AUTH_KEY = 'pokemon_test_auth';

/**
 * Get the current session token from localStorage
 * @returns {string|null} The session access token or null
 */
function getSessionToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const testAuthData = localStorage.getItem(TEST_AUTH_KEY);
    if (testAuthData) {
      const parsed = JSON.parse(testAuthData);
      return parsed.session?.access_token || null;
    }
  } catch (e) {
    console.error('Failed to get session token:', e);
  }

  return null;
}

/**
 * Authenticated fetch wrapper
 * Automatically adds Authorization header with session token
 *
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options (optional)
 * @returns {Promise<Response>} Fetch response
 */
export async function apiFetch(url, options = {}) {
  const token = getSessionToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

export default apiFetch;
