/**
 * Generate project create form HTML
 * @returns {string} Form HTML
 */
export function getProjectCreateForm() {
  return `
      <div class="form-group">
        <label for="project-name">Name *</label>
        <input type="text" id="project-name" name="name" required>
      </div>
      <div class="form-group">
        <label for="project-description">Description</label>
        <textarea id="project-description" name="description"></textarea>
      </div>
      <div class="form-group">
        <label for="project-status">Status *</label>
        <select id="project-status" name="status" required>
          <option value="">Select status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    `;
}

/**
 * Generate project edit form HTML
 * @param {Object} project - Project data
 * @returns {string} Form HTML
 */
export function getProjectEditForm(project) {
  if (!project) {
    throw new Error("Project data is required");
  }

  const name = project.name || "";
  const description = project.description || "";
  const status = project.status || "";

  return `
      <div class="form-group">
        <label for="project-name">Name *</label>
        <input type="text" id="project-name" name="name" value="${name}" required>
      </div>
      <div class="form-group">
        <label for="project-description">Description</label>
        <textarea id="project-description" name="description">${description}</textarea>
      </div>
      <div class="form-group">
        <label for="project-status">Status *</label>
        <select id="project-status" name="status" required>
          <option value="">Select status</option>
          <option value="active" ${status === "active" ? "selected" : ""}>Active</option>
          <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
          <option value="archived" ${status === "archived" ? "selected" : ""}>Archived</option>
        </select>
      </div>
    `;
}
