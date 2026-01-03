import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import TestAuthForm from '../components/auth/TestAuthForm';
import { useAuth } from '../lib/authContext';

export default function TestAuthPage() {
  const router = useRouter();
  const { user, loading: authLoading, setTestAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if test auth is enabled
  const testAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === 'true';

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success) {
        // Store the test auth session
        setTestAuth({
          user: result.data.user,
          session: result.data.session,
        });
        // Redirect to home page on success
        router.push('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError({
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show disabled message if test auth is not enabled
  if (!testAuthEnabled) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Test Auth Disabled</h1>
          <p style={styles.message}>
            Test authentication is not enabled in this environment.
          </p>
          <p style={styles.hint}>
            To enable test auth, set <code>NEXT_PUBLIC_ENABLE_TEST_AUTH=true</code> in
            your .env.local file and restart the development server.
          </p>
          <a href="/" style={styles.link}>
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.message}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Test Authentication</h1>
          <p style={styles.subtitle}>Development Login</p>
        </div>

        <div style={styles.warningBanner}>
          <strong>Development Only</strong>
          <span>This screen is only available in development mode.</span>
        </div>

        <TestAuthForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        <div style={styles.footer}>
          <a href="/" style={styles.backLink}>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    padding: '1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid #333',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.75rem',
    color: '#fff',
    margin: 0,
  },
  subtitle: {
    fontSize: '1rem',
    color: '#888',
    marginTop: '0.5rem',
  },
  warningBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    backgroundColor: '#2d2600',
    border: '1px solid #fbbf24',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    color: '#fbbf24',
  },
  message: {
    color: '#ccc',
    textAlign: 'center',
    margin: 0,
  },
  hint: {
    color: '#888',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginTop: '1rem',
    lineHeight: '1.5',
  },
  link: {
    display: 'inline-block',
    marginTop: '1.5rem',
    color: '#818cf8',
    textDecoration: 'none',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  backLink: {
    color: '#888',
    textDecoration: 'none',
    fontSize: '0.875rem',
  },
};
