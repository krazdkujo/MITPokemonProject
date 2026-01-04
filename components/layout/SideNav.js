/**
 * SideNav Component
 *
 * Left sidebar containing:
 * - Navigation links to all game sections
 * - Mini party display with HP bars
 *
 * Feature: 011-game-layout
 */

import React from 'react';
import NavLink from './NavLink';
import MiniPartyDisplay from './MiniPartyDisplay';
import {
  HomeIcon,
  SwordIcon,
  ShopIcon,
  HealIcon,
  GrassIcon,
  BagIcon,
  ZonesIcon,
} from './NavIcons';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', Icon: HomeIcon },
  { href: '/zones', label: 'Encounter Zones', Icon: ZonesIcon },
  { href: '/combat', label: 'Combat Arena', Icon: SwordIcon },
  { href: '/pokemart', label: 'PokeMart', Icon: ShopIcon },
  { href: '/pokecenter', label: 'Pokemon Center', Icon: HealIcon },
  { href: '/wild', label: 'Wild Pokemon', Icon: GrassIcon },
  { href: '/inventory', label: 'Inventory', Icon: BagIcon },
];

export default function SideNav() {
  return (
    <aside className="side-nav">
      <nav className="side-nav__links">
        {NAV_LINKS.map(({ href, label, Icon }) => (
          <NavLink key={href} href={href} icon={<Icon />}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="side-nav__divider" />

      <div className="side-nav__party">
        <h3 className="side-nav__party-title">Your Party</h3>
        <MiniPartyDisplay />
      </div>

      <style jsx>{`
        .side-nav {
          width: 240px;
          background: rgba(0, 0, 0, 0.2);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          padding: 16px 0;
        }

        .side-nav__links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 12px;
        }

        .side-nav__divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 16px 12px;
        }

        .side-nav__party {
          padding: 0 12px;
          flex: 1;
        }

        .side-nav__party-title {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }
      `}</style>
    </aside>
  );
}
