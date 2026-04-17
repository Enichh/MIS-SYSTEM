'use client'

import { useState } from 'react'

export default function Navigation() {
  const [activeSection, setActiveSection] = useState('employees')

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    // Hide all sections
    document.querySelectorAll('.section').forEach((el) => {
      el.classList.remove('active')
    })
    // Show selected section
    const selectedSection = document.getElementById(`${section}-section`)
    if (selectedSection) {
      selectedSection.classList.add('active')
    }
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.remove('active')
      if (btn.getAttribute('data-section') === section) {
        btn.classList.add('active')
      }
    })
  }

  return (
    <nav>
      <button
        data-section="employees"
        className={`nav-btn ${activeSection === 'employees' ? 'active' : ''}`}
        onClick={() => handleSectionChange('employees')}
      >
        Employees
      </button>
      <button
        data-section="projects"
        className={`nav-btn ${activeSection === 'projects' ? 'active' : ''}`}
        onClick={() => handleSectionChange('projects')}
      >
        Projects
      </button>
      <button
        data-section="tasks"
        className={`nav-btn ${activeSection === 'tasks' ? 'active' : ''}`}
        onClick={() => handleSectionChange('tasks')}
      >
        Tasks
      </button>
    </nav>
  )
}
