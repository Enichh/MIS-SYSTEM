import Header from './components/Header/Header'
import Navigation from './components/Navigation/Navigation'
import EmployeeList from './components/EmployeeList/EmployeeList'
import ProjectList from './components/ProjectList/ProjectList'
import TaskList from './components/TaskList/TaskList'
import ChatModal from './components/ChatModal/ChatModal'
import EmployeeForm from './components/forms/EmployeeForm/EmployeeForm'
import ProjectForm from './components/forms/ProjectForm/ProjectForm'
import TaskForm from './components/forms/TaskForm/TaskForm'

export default function HomePage() {
  return (
    <>
      <Header />
      <Navigation />

      <main className="main-content">
        <section id="employees-section" className="section section-active">
          <div className="section-header">
            <h2>Employees</h2>
            <EmployeeForm />
          </div>
          <EmployeeList />
        </section>

        <section id="projects-section" className="section">
          <div className="section-header">
            <h2>Projects</h2>
            <ProjectForm />
          </div>
          <ProjectList />
        </section>

        <section id="tasks-section" className="section">
          <div className="section-header">
            <h2>Tasks</h2>
            <TaskForm />
          </div>
          <TaskList />
        </section>
      </main>

      <ChatModal />
    </>
  )
}
