import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const TEST_AUTH_KEY = 'pokemon_test_auth';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  setTestAuth: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // First check for test auth session in localStorage
        if (typeof window !== 'undefined') {
          const testAuthData = localStorage.getItem(TEST_AUTH_KEY);
          if (testAuthData) {
            try {
              const parsed = JSON.parse(testAuthData);
              // Check if session is expired
              if (parsed.session?.expires_at && new Date(parsed.session.expires_at) > new Date()) {
                setUser(parsed.user);
                setSession(parsed.session);
                setLoading(false);
                return;
              } else {
                // Session expired, clear it
                localStorage.removeItem(TEST_AUTH_KEY);
              }
            } catch (e) {
              localStorage.removeItem(TEST_AUTH_KEY);
            }
          }
        }

        // Fall back to Supabase Auth (for production JWT auth later)
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes (Supabase Auth)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        // Only update if we don't have a test auth session
        if (typeof window !== 'undefined' && !localStorage.getItem(TEST_AUTH_KEY)) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Set test auth session (called after successful test login)
  const setTestAuth = (authData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TEST_AUTH_KEY, JSON.stringify(authData));
      setUser(authData.user);
      setSession(authData.session);
    }
  };

  const signOut = async () => {
    try {
      // Clear test auth session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TEST_AUTH_KEY);
      }
      // Also sign out of Supabase Auth
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    setTestAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
