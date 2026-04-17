'use client';

import React from 'react';
import { useNavigationContext } from '@/lib/context/NavigationContext';
import { NavigationLinks } from '@/app/components/NavigationLinks/NavigationLinks';

export function Drawer() {
  const { activeSection, setActiveSection, isDrawerOpen, isMobile, closeDrawer } = useNavigationContext();

  const handleSectionChange = (section: 'employees' | 'projects' | 'tasks' | 'ai') => {
    setActiveSection(section);
    closeDrawer();
  };

  const handleBackdropClick = () => {
    closeDrawer();
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <div
        className={`drawer-backdrop ${isDrawerOpen ? 'drawer-backdrop-visible' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className={`drawer ${isDrawerOpen ? 'drawer-open' : ''}`}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        <nav>
          <NavigationLinks activeSection={activeSection} onSectionChange={handleSectionChange} />
        </nav>
      </div>
    </>
  );
}
