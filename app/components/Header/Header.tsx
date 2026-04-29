"use client";

import ThemeToggle from "../ThemeToggle/ThemeToggle";
import { HamburgerButton } from "../HamburgerButton/HamburgerButton";

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <HamburgerButton />
          <div className="header-title">
            <h1>Enosoft</h1>
          </div>
        </div>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
