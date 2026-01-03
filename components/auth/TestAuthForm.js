import { useState } from 'react';

/**
 * Test Authentication Form Component
 *
 * Allows developers to enter email/name for testing without real auth.
 * This is for development purposes only.
 */
export default function TestAuthForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        email: email.trim().toLowerCase(),
        name: name.trim(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label htmlFor="email" style={styles.label}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="developer@example.com"
          style={{
            ...styles.input,
            ...(validationErrors.email ? styles.inputError : {}),
          }}
          disabled={loading}
        />
        {validationErrors.email && (
          <span style={styles.errorText}>{validationErrors.email}</span>
        )}
      </div>

      <div style={styles.field}>
        <label htmlFor="name" style={styles.label}>
          Display Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          style={{
            ...styles.input,
            ...(validationErrors.name ? styles.inputError : {}),
          }}
          disabled={loading}
        />
        {validationErrors.name && (
          <span style={styles.errorText}>{validationErrors.name}</span>
        )}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorTitle}>{error.message || 'An error occurred'}</p>
          {error.details && (
            <ul style={styles.errorDetails}>
              {Object.entries(error.details).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button type="submit" style={styles.button} disabled={loading}>
        {loading ? 'Logging in...' : 'Login for Testing'}
      </button>

      <p style={styles.hint}>
        This is a development-only feature. Enter any email and name to create
        or access a test user account.
      </p>
    </form>
  );
}

const styles = {
  form: {
    width: '100%',
    maxWidth: '400px',
  },
  field: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#ccc',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    backgroundColor: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#f87171',
  },
  errorText: {
    display: 'block',
    marginTop: '0.25rem',
    color: '#f87171',
    fontSize: '0.75rem',
  },
  errorBox: {
    backgroundColor: '#2d1f1f',
    border: '1px solid #f87171',
    borderRadius: '6px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: '#f87171',
    margin: 0,
    fontWeight: 'bold',
  },
  errorDetails: {
    margin: '0.5rem 0 0 0',
    paddingLeft: '1.25rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
  },
  button: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  hint: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: '#666',
    textAlign: 'center',
    lineHeight: '1.5',
  },
};
