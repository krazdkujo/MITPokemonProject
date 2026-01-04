import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/authContext';
import { apiFetch } from '../../lib/apiFetch';

/**
 * AuthGuard Component
 *
 * Wrapper component that protects routes based on authentication
 * and Pokemon ownership status.
 *
 * Props:
 *   - children: Content to render when access is allowed
 *   - requirePokemon: If true, redirects to /starter-select if user has no Pokemon (default: false)
 *   - redirectIfHasPokemon: If true, redirects to /dashboard if user already has Pokemon (default: false)
 */
export default function AuthGuard({
  children,
  requirePokemon = false,
  redirectIfHasPokemon = false,
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to complete
      if (authLoading) return;

      // Not authenticated - redirect to login
      if (!user) {
        router.replace('/test-auth');
        return;
      }

      // Check Pokemon status if needed
      if (requirePokemon || redirectIfHasPokemon) {
        try {
          const response = await apiFetch('/api/player/pokemon/check');
          const data = await response.json();

          if (data.success) {
            const hasPokemon = data.data.has_pokemon;

            if (requirePokemon && !hasPokemon) {
              // User needs Pokemon but doesn't have any
              router.replace('/starter-select');
              return;
            }

            if (redirectIfHasPokemon && hasPokemon) {
              // User has Pokemon but shouldn't be on this page
              router.replace('/dashboard');
              return;
            }
          }
        } catch (error) {
          console.error('Error checking Pokemon status:', error);
        }
      }

      // All checks passed
      setHasAccess(true);
      setChecking(false);
    };

    checkAccess();
  }, [user, authLoading, requirePokemon, redirectIfHasPokemon, router]);

  // Show loading while checking
  if (authLoading || checking) {
    return (
      <div className="auth-guard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
        <style jsx>{`
          .auth-guard-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0e0e0;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          p {
            color: #666;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render children only if access is granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Still redirecting, show nothing
  return null;
}
