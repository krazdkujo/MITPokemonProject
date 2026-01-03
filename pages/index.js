import { useAuth } from '../lib/authContext';
import { isConfigured, getMissingEnvVars } from '../lib/supabase';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const configured = isConfigured();
  const missingVars = getMissingEnvVars();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Pokemon Educational Platform</h1>
        <p style={styles.subtitle}>Learn AI and Automation Through Pokemon Battles</p>
      </header>

      <main style={styles.main}>
        {/* Status Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>System Status</h2>

          <div style={styles.statusRow}>
            <span>Application:</span>
            <span style={styles.statusOk}>Running</span>
          </div>

          <div style={styles.statusRow}>
            <span>Environment:</span>
            <span style={configured ? styles.statusOk : styles.statusError}>
              {configured ? 'Configured' : 'Missing Variables'}
            </span>
          </div>

          {!configured && (
            <div style={styles.errorBox}>
              <p style={styles.errorTitle}>Missing Environment Variables:</p>
              <ul style={styles.errorList}>
                {missingVars.map((v) => (
                  <li key={v}>{v}</li>
                ))}
              </ul>
              <p style={styles.errorHint}>
                Copy .env.example to .env.local and add your Supabase credentials.
              </p>
            </div>
          )}

          <div style={styles.statusRow}>
            <span>User Session:</span>
            <span style={user ? styles.statusOk : styles.statusWarn}>
              {loading ? 'Loading...' : user ? `Logged in as ${user.email}` : 'Not authenticated'}
            </span>
          </div>

          {user && (
            <div style={styles.signOutRow}>
              <span>Logged in as: {user.name}</span>
              <button onClick={signOut} style={styles.signOutButton}>
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Quick Links</h2>

          <div style={styles.linkGrid}>
            <a href="/test-auth" style={styles.link}>
              <div style={styles.linkCard}>
                <h3>Test Auth</h3>
                <p>Login for development testing</p>
              </div>
            </a>

            <a href="/api/health" style={styles.link} target="_blank" rel="noopener noreferrer">
              <div style={styles.linkCard}>
                <h3>Health Check</h3>
                <p>Verify database connection</p>
              </div>
            </a>
          </div>
        </div>

        {/* Version Info */}
        <div style={styles.footer}>
          <p>Pokemon Educational Platform v2.0</p>
          <p style={styles.footerSub}>Built for MIT AI Education</p>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#eee',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    textAlign: 'center',
    padding: '3rem 1rem',
    background: 'linear-gradient(135deg, #16213e 0%, #1a1a2e 100%)',
    borderBottom: '1px solid #333',
  },
  title: {
    fontSize: '2.5rem',
    margin: 0,
    color: '#fff',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#888',
    marginTop: '0.5rem',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    border: '1px solid #333',
  },
  cardTitle: {
    fontSize: '1.25rem',
    marginTop: 0,
    marginBottom: '1rem',
    color: '#fff',
    borderBottom: '1px solid #333',
    paddingBottom: '0.5rem',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid #222',
  },
  statusOk: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  statusWarn: {
    color: '#fbbf24',
  },
  statusError: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#2d1f1f',
    border: '1px solid #f87171',
    borderRadius: '4px',
    padding: '1rem',
    margin: '1rem 0',
  },
  errorTitle: {
    color: '#f87171',
    margin: '0 0 0.5rem 0',
    fontWeight: 'bold',
  },
  errorList: {
    margin: '0.5rem 0',
    paddingLeft: '1.5rem',
    color: '#fca5a5',
  },
  errorHint: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.875rem',
    color: '#888',
  },
  signOutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0 0 0',
    marginTop: '0.5rem',
    borderTop: '1px solid #333',
  },
  signOutButton: {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  linkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
  },
  linkCard: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '1rem',
    transition: 'border-color 0.2s, transform 0.2s',
    cursor: 'pointer',
  },
  footer: {
    textAlign: 'center',
    padding: '2rem 0',
    color: '#666',
  },
  footerSub: {
    fontSize: '0.875rem',
    marginTop: '0.25rem',
  },
};
