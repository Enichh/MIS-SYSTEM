'use client';

import React from 'react';
import { UserIcon } from '@/app/components/ui/icons/custom/UserIcon';
import { SettingsIcon } from '@/app/components/ui/icons/custom/SettingsIcon';
import { CheckIcon } from '@/app/components/ui/icons/custom/CheckIcon';
import { MessageIcon } from '@/app/components/ui/icons/custom/MessageIcon';

type Section = 'employees' | 'projects' | 'tasks' | 'ai';

interface NavigationLinksProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export function NavigationLinks({ activeSection, onSectionChange }: NavigationLinksProps) {
  return (
    <ul className="sidebar-nav">
      <li>
        <button
          className={`sidebar-link ${activeSection === 'employees' ? 'active' : ''}`}
          onClick={() => onSectionChange('employees')}
          aria-label="Navigate to Employees section"
          aria-current={activeSection === 'employees' ? 'page' : undefined}
        >
          <UserIcon size={20} />
          <span>Employees</span>
        </button>
      </li>
      <li>
        <button
          className={`sidebar-link ${activeSection === 'projects' ? 'active' : ''}`}
          onClick={() => onSectionChange('projects')}
          aria-label="Navigate to Projects section"
          aria-current={activeSection === 'projects' ? 'page' : undefined}
        >
          <CheckIcon size={20} />
          <span>Projects</span>
        </button>
      </li>
      <li>
        <button
          className={`sidebar-link ${activeSection === 'tasks' ? 'active' : ''}`}
          onClick={() => onSectionChange('tasks')}
          aria-label="Navigate to Tasks section"
          aria-current={activeSection === 'tasks' ? 'page' : undefined}
        >
          <SettingsIcon size={20} />
          <span>Tasks</span>
        </button>
      </li>
      <li>
        <button
          className={`sidebar-link ${activeSection === 'ai' ? 'active' : ''}`}
          onClick={() => onSectionChange('ai')}
          aria-label="Navigate to AI Chat section"
          aria-current={activeSection === 'ai' ? 'page' : undefined}
        >
          <MessageIcon size={20} />
          <span>AI Chat</span>
        </button>
      </li>
    </ul>
  );
}
