'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/app/components/ui/Button/Button'

interface NavigationProps {
  onSectionChange?: (section: string) => void
}

export default function Navigation({ onSectionChange }: NavigationProps) {
  const [activeSection, setActiveSection] = useState('employees')

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    onSectionChange?.(section)
    
    // Maintain backward compatibility: update DOM for section visibility
    document.querySelectorAll('.section').forEach((el) => {
      el.classList.remove('active')
    })
    const selectedSection = document.getElementById(`${section}-section`)
    if (selectedSection) {
      selectedSection.classList.add('active')
    }
  }

  return (
    <nav className="flex gap-2 p-4 border-b">
      <Button
        variant={activeSection === 'employees' ? 'primary' : 'ghost'}
        onClick={() => handleSectionChange('employees')}
        icon="user"
        aria-label="Navigate to Employees section"
        aria-pressed={activeSection === 'employees'}
      >
        Employees
      </Button>
      <Button
        variant={activeSection === 'projects' ? 'primary' : 'ghost'}
        onClick={() => handleSectionChange('projects')}
        icon="settings"
        aria-label="Navigate to Projects section"
        aria-pressed={activeSection === 'projects'}
      >
        Projects
      </Button>
      <Button
        variant={activeSection === 'tasks' ? 'primary' : 'ghost'}
        onClick={() => handleSectionChange('tasks')}
        icon="check"
        aria-label="Navigate to Tasks section"
        aria-pressed={activeSection === 'tasks'}
      >
        Tasks
      </Button>
    </nav>
  )
}
