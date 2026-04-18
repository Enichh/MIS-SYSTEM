'use client'

import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { HamburgerButton } from '../HamburgerButton/HamburgerButton'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <HamburgerButton />
        <div className="header-title">
          <h1>Enosoft Project Management System</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
