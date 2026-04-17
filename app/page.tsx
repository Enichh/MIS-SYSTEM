'use client'

import Header from './components/Header/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Drawer } from './components/Drawer/Drawer'
import EmployeeList from './components/EmployeeList/EmployeeList'
import ProjectList from './components/ProjectList/ProjectList'
import TaskList from './components/TaskList/TaskList'
import { DrawerChat } from './components/DrawerChat/DrawerChat'
import EmployeeForm from './components/forms/EmployeeForm/EmployeeForm'
import ProjectForm from './components/forms/ProjectForm/ProjectForm'
import TaskForm from './components/forms/TaskForm/TaskForm'
import QuickActionsBar from './components/QuickActionsBar/QuickActionsBar'
import { useNavigationContext, type Section } from '@/lib/context/NavigationContext'

export default function HomePage() {
  const { activeSection } = useNavigationContext()

  return (
    <>
      <Header />
      <Drawer />

      <div className="app-layout">
        <Sidebar />
        <main className="main">
          <section id="employees-section" className={`section ${activeSection === 'employees' ? 'section-active' : ''}`}>
            <div className="section-header">
              <h2>Employees</h2>
              <EmployeeForm />
            </div>
            <EmployeeList />
          </section>

          <section id="projects-section" className={`section ${activeSection === 'projects' ? 'section-active' : ''}`}>
            <div className="section-header">
              <h2>Projects</h2>
              <ProjectForm />
            </div>
            <ProjectList />
          </section>

          <section id="tasks-section" className={`section ${activeSection === 'tasks' ? 'section-active' : ''}`}>
            <div className="section-header">
              <h2>Tasks</h2>
              <TaskForm />
            </div>
            <TaskList />
          </section>

          <section id="ai-section" className={`section ${activeSection === 'ai' ? 'section-active' : ''}`}>
            <QuickActionsBar />
            <DrawerChat />
          </section>
        </main>
      </div>
    </>
  )
}
