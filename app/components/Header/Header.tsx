'use client'

import ThemeToggle from '../ThemeToggle/ThemeToggle'
import { HamburgerButton } from '../HamburgerButton/HamburgerButton'
import { Icon } from '@/app/components/ui/icons/Icon'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <HamburgerButton />
        <div className="header-title">
          <Icon name="house" size={24} />
          <h1>Enosoft Project Management System</h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
