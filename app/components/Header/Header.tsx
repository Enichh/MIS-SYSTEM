"use client";

import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { HamburgerButton } from "../HamburgerButton/HamburgerButton";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const { admin, logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      window.location.href = "/login";
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <HamburgerButton />
        <div className="header-title">
          <h1>Enosoft</h1>
        </div>
        <div className="header-actions">
          {admin && (
            <div className="header-admin-info">
              <User className="header-admin-icon" />
              <span className="header-admin-name">{admin.full_name}</span>
            </div>
          )}
          <button
            className="header-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="header-logout-icon" />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
