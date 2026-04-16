/**
 * @fileoverview Task form component for creating/editing tasks
 * @module features/tasks/components/taskForm
 */

import { getAllProjects } from "../../../shared/services/database.js";

/**
 * Populates the project select dropdown
 * @returns {Promise<void>}
 */
async function populateProjectSelect() {
  try {
    const projects = await getAllProjects();
    const select = document.getElementById("task-projectId");
    select.innerHTML = '<option value="">Select project</option>';
    projects.forEach((project) => {
      select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
    });
  } catch (error) {
    console.error("Failed to populate project select:", error);
    const select = document.getElementById("task-projectId");
    select.innerHTML = '<option value="">Error loading projects</option>';
  }
}

/**
 * Generates task form HTML content
 * @param {Object} data - Optional task data for edit mode
 * @returns {string} HTML string for the form
 */
function getTaskFormContent(data = null) {
  const projectId = data ? `value="${data.projectId}"` : "";
  const title = data ? `value="${data.title}"` : "";
  const description = data ? `${data.description || ""}` : "";
  const statusPending = data && data.status === "pending" ? "selected" : "";
  const statusInProgress =
    data && data.status === "in-progress" ? "selected" : "";
  const statusCompleted = data && data.status === "completed" ? "selected" : "";

  return `
    <div class="form-group">
      <label for="task-projectId">Project *</label>
      <select id="task-projectId" name="projectId" required>
        <option value="">Select project</option>
      </select>
    </div>
    <div class="form-group">
      <label for="task-title">Title *</label>
      <input type="text" id="task-title" name="title" ${title} required>
    </div>
    <div class="form-group">
      <label for="task-description">Description</label>
      <textarea id="task-description" name="description">${description}</textarea>
    </div>
    <div class="form-group">
      <label for="task-status">Status *</label>
      <select id="task-status" name="status" required>
        <option value="">Select status</option>
        <option value="pending" ${statusPending}>Pending</option>
        <option value="in-progress" ${statusInProgress}>In Progress</option>
        <option value="completed" ${statusCompleted}>Completed</option>
      </select>
    </div>
  `;
}

export { populateProjectSelect, getTaskFormContent };
