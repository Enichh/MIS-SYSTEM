import { getAllProjects } from "../../../shared/services/database.js";

/**
 * Render projects list to DOM
 * @returns {Promise<void>}
 */
export async function renderProjects() {
  const list = document.getElementById("projects-list");
  if (!list) {
    throw new Error("Element 'projects-list' not found in DOM");
  }

  const projects = await getAllProjects();

  if (!projects || projects.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No Projects Found</h3>
        <p>Click "Add Project" to create your first project.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "data-card";

    const header = document.createElement("div");
    header.className = "data-card-header";

    const headerContent = document.createElement("div");

    const title = document.createElement("div");
    title.className = "data-card-title";
    title.textContent = project.name || "";

    const subtitle = document.createElement("div");
    subtitle.className = "data-card-subtitle";
    subtitle.textContent = project.description || "No description";

    headerContent.appendChild(title);
    headerContent.appendChild(subtitle);

    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge status-${project.status}`;
    statusBadge.textContent = project.status || "";

    header.appendChild(headerContent);
    header.appendChild(statusBadge);

    const body = document.createElement("div");
    body.className = "data-card-body";

    const employeesPara = document.createElement("p");
    employeesPara.innerHTML = `<strong>Assigned Employees:</strong> ${(project.assignedEmployees || []).length}`;

    const tasksPara = document.createElement("p");
    tasksPara.innerHTML = `<strong>Tasks:</strong> ${(project.tasks || []).length}`;

    body.appendChild(employeesPara);
    body.appendChild(tasksPara);

    const actions = document.createElement("div");
    actions.className = "data-card-actions";

    const assignButton = document.createElement("button");
    assignButton.className = "btn-secondary";
    assignButton.textContent = "Assign Employees";
    assignButton.dataset.action = "assign-project";
    assignButton.dataset.entity = "project";
    assignButton.dataset.id = project.id;

    const editButton = document.createElement("button");
    editButton.className = "btn-secondary";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.entity = "project";
    editButton.dataset.id = project.id;

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn-danger";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.entity = "project";
    deleteButton.dataset.id = project.id;

    actions.appendChild(assignButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    list.appendChild(card);
  });
}
