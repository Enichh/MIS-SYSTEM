"use client";

import React from "react";
import {
  useNavigationContext,
  type Section,
} from "@/lib/context/NavigationContext";
import { NavigationLinks } from "@/app/components/NavigationLinks/NavigationLinks";

export function Sidebar() {
  const { activeSection, setActiveSection } = useNavigationContext();

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <nav>
        <NavigationLinks
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </nav>
    </aside>
  );
}
