import {
  getAllEmployees,
} from "../../../shared/services/database.js";
import { WORK_TYPE_ONSITE } from "../../../shared/services/validators.js";

/**
 * Render employees list to DOM
 * @returns {Promise<void>}
 */
export async function renderEmployees() {
  const list = document.getElementById("employees-list");
  if (!list) {
    throw new Error("Element 'employees-list' not found in DOM");
  }

  const employees = await getAllEmployees();

  if (!employees || employees.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No Employees Found</h3>
        <p>Click "Add Employee" to create your first employee.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = "";

  employees.forEach((employee) => {
    const card = document.createElement("div");
    card.className = "data-card";

    const header = document.createElement("div");
    header.className = "data-card-header";

    const headerContent = document.createElement("div");

    const title = document.createElement("div");
    title.className = "data-card-title";
    title.textContent = employee.name || "";

    const subtitle = document.createElement("div");
    subtitle.className = "data-card-subtitle";
    subtitle.textContent = employee.email || "";

    headerContent.appendChild(title);
    headerContent.appendChild(subtitle);

    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge status-${employee.workType === WORK_TYPE_ONSITE ? "active" : "pending"}`;
    statusBadge.textContent = employee.workType || "";

    header.appendChild(headerContent);
    header.appendChild(statusBadge);

    const body = document.createElement("div");
    body.className = "data-card-body";

    const projectsPara = document.createElement("p");
    projectsPara.innerHTML = `<strong>Assigned Projects:</strong> ${(employee.assignedProjects || []).length}`;

    const tasksPara = document.createElement("p");
    tasksPara.innerHTML = `<strong>Assigned Tasks:</strong> ${(employee.assignedTasks || []).length}`;

    body.appendChild(projectsPara);
    body.appendChild(tasksPara);

    const actions = document.createElement("div");
    actions.className = "data-card-actions";

    const editButton = document.createElement("button");
    editButton.className = "btn-secondary";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";
    editButton.dataset.entity = "employee";
    editButton.dataset.id = employee.id;

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn-danger";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.entity = "employee";
    deleteButton.dataset.id = employee.id;

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);

    list.appendChild(card);
  });
}
