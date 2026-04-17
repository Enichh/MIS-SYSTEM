import type { Employee } from '@/types'

async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch('/api/employees', {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }
  return response.json()
}

export default async function EmployeeList() {
  try {
    const employees = await fetchEmployees()

    if (!employees || employees.length === 0) {
      return (
        <div className="empty-state">
        <h3>No Employees Found</h3>
        <p>Click &quot;Add Employee&quot; to create your first employee.</p>
        </div>
      )
    }

    return (
      <div className="data-list">
        {employees.map((employee) => (
          <div key={employee.id} className="data-card">
            <div className="data-card-header">
              <div>
                <div className="data-card-title">{employee.name}</div>
                <div className="data-card-subtitle">{employee.email}</div>
              </div>
              <span className="status-badge status-active">
                {employee.role}
              </span>
            </div>
            <div className="data-card-body">
              <p>
                <strong>Department:</strong> {employee.department}
              </p>
              <p>
                <strong>Assigned Projects:</strong> {employee.projects?.length || 0}
              </p>
            </div>
            <div className="data-card-actions">
              <button
                data-action="edit"
                data-entity="employee"
                data-id={employee.id}
                className="btn-secondary"
              >
                Edit
              </button>
              <button
                data-action="delete"
                data-entity="employee"
                data-id={employee.id}
                className="btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    return (
      <div className="empty-state">
        <h3>Error Loading Employees</h3>
        <p>Failed to load employees. Please refresh the page.</p>
      </div>
    )
  }
}
