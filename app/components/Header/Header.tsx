'use client'

import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { HamburgerButton } from '../HamburgerButton/HamburgerButton'
import { useAuthContext } from '@/lib/context/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const { admin, logout } = useAuthContext()

  const handleLogout = async () => {
    await logout()
    // Redirect to login page
    window.location.href = '/login'
  }

  return (
    <header className="header">
      <div className="header-content">
        <HamburgerButton />
        <div className="header-title">
          <h1>Enosoft Project Management System</h1>
        </div>
        <div className="header-actions">
          {admin && (
            <div className="header-admin-info">
              <User className="header-admin-icon" />
              <span className="header-admin-name">{admin.full_name}</span>
              <button 
                className="header-logout-btn" 
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="header-logout-icon" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
