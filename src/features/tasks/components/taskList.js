/**
 * @fileoverview Task list component for rendering tasks
 * @module features/tasks/components/taskList
 */

import {
  getAllTasks,
  getAllProjects,
} from "../../../shared/services/database.js";

/**
 * Renders the task list
 * @returns {Promise<void>}
 */
async function renderTasks() {
  try {
    const list = document.getElementById("tasks-list");
    const tasks = await getAllTasks();
    const projects = await getAllProjects();

    if (tasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <h3>No Tasks Found</h3>
          <p>Click "Add Task" to create your first task.</p>
        </div>
      `;
      return;
    }

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    list.innerHTML = tasks
      .map(
        (task) => `
      <div class="data-card">
        <div class="data-card-header">
          <div>
            <div class="data-card-title">${task.title}</div>
            <div class="data-card-subtitle">${projectMap.get(task.projectId) || "Unknown Project"}</div>
          </div>
          <span class="status-badge status-${task.status}">${task.status}</span>
        </div>
        <div class="data-card-body">
          <p><strong>Description:</strong> ${task.description || "No description"}</p>
          <p><strong>Assigned Employees:</strong> ${task.assignedEmployees.length}</p>
        </div>
        <div class="data-card-actions">
          <button data-action="assign-task" data-entity="task" data-id="${task.id}" class="btn-secondary">Assign Employees</button>
          <button data-action="edit" data-entity="task" data-id="${task.id}" class="btn-secondary">Edit</button>
          <button data-action="delete" data-entity="task" data-id="${task.id}" class="btn-danger">Delete</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (error) {
    console.error("Failed to render tasks:", error);
    const list = document.getElementById("tasks-list");
    list.innerHTML = `
      <div class="empty-state">
        <h3>Error Loading Tasks</h3>
        <p>Failed to load tasks. Please refresh the page.</p>
      </div>
    `;
  }
}

export { renderTasks };
