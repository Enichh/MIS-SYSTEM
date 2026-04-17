import Header from './components/Header/Header'
import Navigation from './components/Navigation/Navigation'
import EmployeeList from './components/EmployeeList/EmployeeList'
import ProjectList from './components/ProjectList/ProjectList'
import TaskList from './components/TaskList/TaskList'
import ChatModal from './components/ChatModal/ChatModal'

export default function HomePage() {
  return (
    <>
      <Header />
      <Navigation />

      <main>
        <section id="employees-section" className="section active">
          <div className="section-header">
            <h2>Employees</h2>
            <button
              data-action="create"
              data-entity="employee"
              className="btn-primary"
            >
              Add Employee
            </button>
          </div>
          <EmployeeList />
        </section>

        <section id="projects-section" className="section">
          <div className="section-header">
            <h2>Projects</h2>
            <button
              data-action="create"
              data-entity="project"
              className="btn-primary"
            >
              Add Project
            </button>
          </div>
          <ProjectList />
        </section>

        <section id="tasks-section" className="section">
          <div className="section-header">
            <h2>Tasks</h2>
            <button data-action="create" data-entity="task" className="btn-primary">
              Add Task
            </button>
          </div>
          <TaskList />
        </section>
      </main>

      <div id="modal-overlay" className="modal-overlay hidden">
        <div className="modal">
          <div className="modal-header">
            <h3 id="modal-title">Modal Title</h3>
            <button id="modal-close" className="btn-close">&times;</button>
          </div>
          <div className="modal-body">
            <form id="modal-form"></form>
          </div>
        </div>
      </div>

      <div id="notification" className="notification hidden"></div>

      <ChatModal />
    </>
  )
}
