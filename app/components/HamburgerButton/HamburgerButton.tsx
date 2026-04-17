'use client';

import React from 'react';
import { useNavigationContext } from '@/lib/context/NavigationContext';

export function HamburgerButton() {
  const { isDrawerOpen, isMobile, toggleDrawer } = useNavigationContext();

  if (!isMobile) {
    return null;
  }

  return (
    <button
      className="hamburger-button"
      onClick={toggleDrawer}
      aria-label="Open navigation menu"
      aria-expanded={isDrawerOpen}
      aria-controls="mobile-drawer"
    >
      <span className="hamburger-line" />
      <span className="hamburger-line" />
      <span className="hamburger-line" />
    </button>
  );
}
