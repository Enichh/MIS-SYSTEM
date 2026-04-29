"use client";

import React from "react";
import {
  useNavigationContext,
  type Section,
} from "@/lib/context/NavigationContext";
import { NavigationLinks } from "@/app/components/NavigationLinks/NavigationLinks";
import { useAuth } from "@/lib/hooks/useAuth";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { LogOut, User } from "lucide-react";

export function Drawer() {
  const {
    activeSection,
    setActiveSection,
    isDrawerOpen,
    isMobile,
    closeDrawer,
  } = useNavigationContext();
  
  const { admin, logout } = useAuth();

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    closeDrawer();
  };

  const handleBackdropClick = () => {
    closeDrawer();
  };
  
  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      window.location.href = "/login";
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <>
      <div
        className={`drawer-backdrop ${isDrawerOpen ? "drawer-backdrop-visible" : ""}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className={`drawer ${isDrawerOpen ? "drawer-open" : ""}`}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <nav style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          <NavigationLinks
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </nav>
        
        <div className="drawer-footer" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "24px", borderTop: "1px solid var(--border-dark)" }}>
          {admin && (
            <div className="drawer-admin-info" style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--color-text-secondary)" }}>
              <User size={18} />
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{admin.full_name}</span>
            </div>
          )}
          <div className="drawer-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: "var(--text-sm)", fontWeight: 500 }}
              title="Sign out"
              className="sidebar-link"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
