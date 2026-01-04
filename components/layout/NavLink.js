/**
 * NavLink Component
 *
 * Individual navigation link with:
 * - Icon display
 * - Active state detection using useRouter
 * - Hover effects
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function NavLink({ href, icon, children }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link href={href} className={`nav-link ${isActive ? 'nav-link--active' : ''}`}>
      <span className="nav-link__icon">{icon}</span>
      <span className="nav-link__label">{children}</span>

      <style jsx global>{`
        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-link--active {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .nav-link--active:hover {
          background: rgba(251, 191, 36, 0.25);
          color: #fbbf24;
        }

        .nav-link__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .nav-link__icon svg {
          width: 18px;
          height: 18px;
        }

        .nav-link__label {
          flex: 1;
        }
      `}</style>
    </Link>
  );
}
