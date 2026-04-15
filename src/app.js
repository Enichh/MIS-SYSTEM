import { generateId } from "./shared/models.js";
import {
  openDatabase,
  createEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getAllEmployees,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getAllProjects,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  getAllTasks,
  assignEmployeeToProject,
  assignEmployeeToTask,
  removeEmployeeFromProject,
  removeEmployeeFromTask,
  DB_NAME,
  DB_VERSION,
  STORE_EMPLOYEES,
  STORE_PROJECTS,
  STORE_TASKS,
} from "./shared/database.js";
import {
  validateEmployee,
  validateProject,
  validateTask,
  WORK_TYPE_ONSITE,
  WORK_TYPE_WFH,
} from "./shared/validators.js";
import { chatInput } from "./frontend-components/chatInput.js";
import { messageList } from "./frontend-components/messageList.js";
import {
  ChatStateManager,
  initializeChatState,
} from "./shared/chatStateManager.js";

let db = null;
let currentSection = "employees";
let chatStateManager = null;
let chatInputControl = null;
let messageListControl = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    db = await openDatabase();
    await renderEmployees();
    await renderProjects();
    await renderTasks();
    setupEventListeners();
    initializeChat();
  } catch (error) {
    showNotification(error.message, "error");
  }
});

function setupEventListeners() {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((button) => {
    button.addEventListener("click", handleNavigation);
  });

  document.addEventListener("click", handleDocumentClick);
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document
    .getElementById("modal-form")
    .addEventListener("submit", handleFormSubmit);
  document
    .getElementById("fab-button")
    .addEventListener("click", openChatModal);
  document
    .getElementById("chat-modal-close")
    .addEventListener("click", closeChatModal);
  document
    .getElementById("chat-modal-overlay")
    .addEventListener("click", handleChatModalOverlayClick);
  document.addEventListener("keydown", handleEscapeKey);
}

function initializeChat() {
  chatStateManager = initializeChatState("enosoft_chat_history");

  const history = chatStateManager.getHistory();
  if (history.length === 0) {
    chatStateManager.addMessage(
      "assistant",
      "Hello! I'm your AI assistant for the Enosoft Project Management System. How can I help you today?",
    );
  }
}

function handleNavigation(event) {
  const section = event.target.dataset.section;
  if (!section) return;

  document
    .querySelectorAll(".nav-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  document
    .querySelectorAll(".section")
    .forEach((sec) => sec.classList.remove("active"));
  document.getElementById(`${section}-section`).classList.add("active");

  currentSection = section;
}

async function handleDocumentClick(event) {
  const action = event.target.dataset.action;
  const entity = event.target.dataset.entity;
  const id = event.target.dataset.id;

  if (action === "create") {
    openCreateModal(entity);
  } else if (action === "edit") {
    await openEditModal(entity, id);
  } else if (action === "delete") {
    await handleDelete(entity, id);
  } else if (action === "assign-project") {
    await openAssignmentModal("project", id);
  } else if (action === "assign-task") {
    await openAssignmentModal("task", id);
  } else if (action === "remove-project") {
    const employeeId = event.target.dataset.employeeId;
    await handleRemoveFromProject(employeeId, id);
  } else if (action === "remove-task") {
    const employeeId = event.target.dataset.employeeId;
    await handleRemoveFromTask(employeeId, id);
  }
}

function openCreateModal(entity) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  title.textContent = `Add ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
  form.dataset.entity = entity;
  form.dataset.mode = "create";

  let formContent = "";

  if (entity === "employee") {
    formContent = `
      <div class="form-group">
        <label for="employee-name">Name *</label>
        <input type="text" id="employee-name" name="name" required>
      </div>
      <div class="form-group">
        <label for="employee-email">Email *</label>
        <input type="email" id="employee-email" name="email" required>
      </div>
      <div class="form-group">
        <label for="employee-workType">Work Type *</label>
        <select id="employee-workType" name="workType" required>
          <option value="">Select work type</option>
          <option value="${WORK_TYPE_ONSITE}">Onsite</option>
          <option value="${WORK_TYPE_WFH}">Work From Home</option>
        </select>
      </div>
    `;
  } else if (entity === "project") {
    formContent = `
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
  } else if (entity === "task") {
    formContent = `
      <div class="form-group">
        <label for="task-projectId">Project *</label>
        <select id="task-projectId" name="projectId" required>
          <option value="">Select project</option>
        </select>
      </div>
      <div class="form-group">
        <label for="task-title">Title *</label>
        <input type="text" id="task-title" name="title" required>
      </div>
      <div class="form-group">
        <label for="task-description">Description</label>
        <textarea id="task-description" name="description"></textarea>
      </div>
      <div class="form-group">
        <label for="task-status">Status *</label>
        <select id="task-status" name="status" required>
          <option value="">Select status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    `;
  }

  formContent += `
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn-primary">Save</button>
    </div>
  `;

  form.innerHTML = formContent;
  modal.classList.remove("hidden");

  if (entity === "task") {
    populateProjectSelect();
  }
}

async function openEditModal(entity, id) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  title.textContent = `Edit ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
  form.dataset.entity = entity;
  form.dataset.mode = "edit";
  form.dataset.id = id;

  let data;
  if (entity === "employee") {
    data = await getEmployee(id);
  } else if (entity === "project") {
    data = await getProject(id);
  } else if (entity === "task") {
    data = await getTask(id);
  }

  if (!data) {
    showNotification(
      `${entity.charAt(0).toUpperCase() + entity.slice(1)} not found`,
      "error",
    );
    return;
  }

  let formContent = "";

  if (entity === "employee") {
    formContent = `
      <div class="form-group">
        <label for="employee-name">Name *</label>
        <input type="text" id="employee-name" name="name" value="${data.name}" required>
      </div>
      <div class="form-group">
        <label for="employee-email">Email *</label>
        <input type="email" id="employee-email" name="email" value="${data.email}" required>
      </div>
      <div class="form-group">
        <label for="employee-workType">Work Type *</label>
        <select id="employee-workType" name="workType" required>
          <option value="">Select work type</option>
          <option value="${WORK_TYPE_ONSITE}" ${data.workType === WORK_TYPE_ONSITE ? "selected" : ""}>Onsite</option>
          <option value="${WORK_TYPE_WFH}" ${data.workType === WORK_TYPE_WFH ? "selected" : ""}>Work From Home</option>
        </select>
      </div>
    `;
  } else if (entity === "project") {
    formContent = `
      <div class="form-group">
        <label for="project-name">Name *</label>
        <input type="text" id="project-name" name="name" value="${data.name}" required>
      </div>
      <div class="form-group">
        <label for="project-description">Description</label>
        <textarea id="project-description" name="description">${data.description || ""}</textarea>
      </div>
      <div class="form-group">
        <label for="project-status">Status *</label>
        <select id="project-status" name="status" required>
          <option value="">Select status</option>
          <option value="active" ${data.status === "active" ? "selected" : ""}>Active</option>
          <option value="completed" ${data.status === "completed" ? "selected" : ""}>Completed</option>
          <option value="archived" ${data.status === "archived" ? "selected" : ""}>Archived</option>
        </select>
      </div>
    `;
  } else if (entity === "task") {
    formContent = `
      <div class="form-group">
        <label for="task-projectId">Project *</label>
        <select id="task-projectId" name="projectId" required>
          <option value="">Select project</option>
        </select>
      </div>
      <div class="form-group">
        <label for="task-title">Title *</label>
        <input type="text" id="task-title" name="title" value="${data.title}" required>
      </div>
      <div class="form-group">
        <label for="task-description">Description</label>
        <textarea id="task-description" name="description">${data.description || ""}</textarea>
      </div>
      <div class="form-group">
        <label for="task-status">Status *</label>
        <select id="task-status" name="status" required>
          <option value="">Select status</option>
          <option value="pending" ${data.status === "pending" ? "selected" : ""}>Pending</option>
          <option value="in-progress" ${data.status === "in-progress" ? "selected" : ""}>In Progress</option>
          <option value="completed" ${data.status === "completed" ? "selected" : ""}>Completed</option>
        </select>
      </div>
    `;
  }

  formContent += `
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn-primary">Update</button>
    </div>
  `;

  form.innerHTML = formContent;
  modal.classList.remove("hidden");

  if (entity === "task") {
    await populateProjectSelect();
    document.getElementById("task-projectId").value = data.projectId;
  }
}

async function openAssignmentModal(type, id) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  const employees = await getAllEmployees();
  let data;
  let assignedIds = [];

  if (type === "project") {
    data = await getProject(id);
    title.textContent = `Assign Employees to Project: ${data.name}`;
    assignedIds = data.assignedEmployees || [];
  } else if (type === "task") {
    data = await getTask(id);
    title.textContent = `Assign Employees to Task: ${data.title}`;
    assignedIds = data.assignedEmployees || [];
  }

  form.dataset.type = type;
  form.dataset.id = id;

  let checkboxContent = '<div class="checkbox-group">';
  employees.forEach((employee) => {
    const isChecked = assignedIds.includes(employee.id) ? "checked" : "";
    checkboxContent += `
      <label>
        <input type="checkbox" name="employees" value="${employee.id}" ${isChecked}>
        ${employee.name} (${employee.email})
      </label>
    `;
  });
  checkboxContent += "</div>";

  const formContent = `
    <div class="form-group">
      <label>Select Employees</label>
      ${checkboxContent}
    </div>
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn-primary">Save Assignments</button>
    </div>
  `;

  form.innerHTML = formContent;
  modal.classList.remove("hidden");
}

async function populateProjectSelect() {
  const projects = await getAllProjects();
  const select = document.getElementById("task-projectId");
  select.innerHTML = '<option value="">Select project</option>';
  projects.forEach((project) => {
    select.innerHTML += `<option value="${project.id}">${project.name}</option>`;
  });
}

function closeModal() {
  const modal = document.getElementById("modal-overlay");
  modal.classList.add("hidden");
  document.getElementById("modal-form").reset();
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const entity = form.dataset.entity;
  const mode = form.dataset.mode;
  const formData = new FormData(form);

  try {
    if (mode === "create") {
      await handleCreate(entity, formData);
    } else if (mode === "edit") {
      await handleUpdate(entity, form.dataset.id, formData);
    } else if (form.dataset.type) {
      await handleAssignment(form.dataset.type, form.dataset.id, formData);
    }

    closeModal();
    showNotification(
      `${entity.charAt(0).toUpperCase() + entity.slice(1)} saved successfully`,
      "success",
    );

    await refreshCurrentSection();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function handleCreate(entity, formData) {
  let data;

  if (entity === "employee") {
    data = {
      id: generateId("emp"),
      name: formData.get("name"),
      email: formData.get("email"),
      workType: formData.get("workType"),
      assignedProjects: [],
      assignedTasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const validation = validateEmployee(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await createEmployee(data);
  } else if (entity === "project") {
    data = {
      id: generateId("prj"),
      name: formData.get("name"),
      description: formData.get("description"),
      status: formData.get("status"),
      assignedEmployees: [],
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const validation = validateProject(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await createProject(data);
  } else if (entity === "task") {
    data = {
      id: generateId("tsk"),
      projectId: formData.get("projectId"),
      title: formData.get("title"),
      description: formData.get("description"),
      status: formData.get("status"),
      assignedEmployees: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const validation = validateTask(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await createTask(data);
  }
}

async function handleUpdate(entity, id, formData) {
  let data;

  if (entity === "employee") {
    data = await getEmployee(id);
    data.name = formData.get("name");
    data.email = formData.get("email");
    data.workType = formData.get("workType");
    data.updatedAt = Date.now();

    const validation = validateEmployee(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await updateEmployee(data);
  } else if (entity === "project") {
    data = await getProject(id);
    data.name = formData.get("name");
    data.description = formData.get("description");
    data.status = formData.get("status");
    data.updatedAt = Date.now();

    const validation = validateProject(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await updateProject(data);
  } else if (entity === "task") {
    data = await getTask(id);
    data.projectId = formData.get("projectId");
    data.title = formData.get("title");
    data.description = formData.get("description");
    data.status = formData.get("status");
    data.updatedAt = Date.now();

    const validation = validateTask(data);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    await updateTask(data);
  }
}

async function handleAssignment(type, id, formData) {
  const selectedEmployees = formData.getAll("employees");

  if (type === "project") {
    const project = await getProject(id);
    const currentAssignments = project.assignedEmployees || [];

    for (const employeeId of selectedEmployees) {
      if (!currentAssignments.includes(employeeId)) {
        await assignEmployeeToProject(employeeId, id);
      }
    }

    for (const employeeId of currentAssignments) {
      if (!selectedEmployees.includes(employeeId)) {
        await removeEmployeeFromProject(employeeId, id);
      }
    }
  } else if (type === "task") {
    const task = await getTask(id);
    const currentAssignments = task.assignedEmployees || [];

    for (const employeeId of selectedEmployees) {
      if (!currentAssignments.includes(employeeId)) {
        await assignEmployeeToTask(employeeId, id);
      }
    }

    for (const employeeId of currentAssignments) {
      if (!selectedEmployees.includes(employeeId)) {
        await removeEmployeeFromTask(employeeId, id);
      }
    }
  }
}

async function handleDelete(entity, id) {
  if (!confirm(`Are you sure you want to delete this ${entity}?`)) {
    return;
  }

  try {
    if (entity === "employee") {
      await deleteEmployee(id);
    } else if (entity === "project") {
      await deleteProject(id);
    } else if (entity === "task") {
      await deleteTask(id);
    }

    showNotification(
      `${entity.charAt(0).toUpperCase() + entity.slice(1)} deleted successfully`,
      "success",
    );
    await refreshCurrentSection();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function handleRemoveFromProject(employeeId, projectId) {
  if (
    !confirm("Are you sure you want to remove this employee from the project?")
  ) {
    return;
  }

  try {
    await removeEmployeeFromProject(employeeId, projectId);
    showNotification("Employee removed from project successfully", "success");
    await refreshCurrentSection();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function handleRemoveFromTask(employeeId, taskId) {
  if (
    !confirm("Are you sure you want to remove this employee from the task?")
  ) {
    return;
  }

  try {
    await removeEmployeeFromTask(employeeId, taskId);
    showNotification("Employee removed from task successfully", "success");
    await refreshCurrentSection();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function refreshCurrentSection() {
  if (currentSection === "employees") {
    await renderEmployees();
  } else if (currentSection === "projects") {
    await renderProjects();
  } else if (currentSection === "tasks") {
    await renderTasks();
  }
}

async function renderEmployees() {
  const list = document.getElementById("employees-list");
  const employees = await getAllEmployees();

  if (employees.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No Employees Found</h3>
        <p>Click "Add Employee" to create your first employee.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = employees
    .map(
      (employee) => `
    <div class="data-card">
      <div class="data-card-header">
        <div>
          <div class="data-card-title">${employee.name}</div>
          <div class="data-card-subtitle">${employee.email}</div>
        </div>
        <span class="status-badge status-${employee.workType === WORK_TYPE_ONSITE ? "active" : "pending"}">${employee.workType}</span>
      </div>
      <div class="data-card-body">
        <p><strong>Assigned Projects:</strong> ${employee.assignedProjects.length}</p>
        <p><strong>Assigned Tasks:</strong> ${employee.assignedTasks.length}</p>
      </div>
      <div class="data-card-actions">
        <button data-action="edit" data-entity="employee" data-id="${employee.id}" class="btn-secondary">Edit</button>
        <button data-action="delete" data-entity="employee" data-id="${employee.id}" class="btn-danger">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
}

async function renderProjects() {
  const list = document.getElementById("projects-list");
  const projects = await getAllProjects();

  if (projects.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <h3>No Projects Found</h3>
        <p>Click "Add Project" to create your first project.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = projects
    .map(
      (project) => `
    <div class="data-card">
      <div class="data-card-header">
        <div>
          <div class="data-card-title">${project.name}</div>
          <div class="data-card-subtitle">${project.description || "No description"}</div>
        </div>
        <span class="status-badge status-${project.status}">${project.status}</span>
      </div>
      <div class="data-card-body">
        <p><strong>Assigned Employees:</strong> ${project.assignedEmployees.length}</p>
        <p><strong>Tasks:</strong> ${project.tasks.length}</p>
      </div>
      <div class="data-card-actions">
        <button data-action="assign-project" data-entity="project" data-id="${project.id}" class="btn-secondary">Assign Employees</button>
        <button data-action="edit" data-entity="project" data-id="${project.id}" class="btn-secondary">Edit</button>
        <button data-action="delete" data-entity="project" data-id="${project.id}" class="btn-danger">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
}

async function renderTasks() {
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
}

function showNotification(message, type) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove("hidden");

  setTimeout(() => {
    notification.classList.add("hidden");
  }, 3000);
}

window.closeModal = closeModal;

async function openChatModal() {
  const chatModal = document.getElementById("chat-modal-overlay");
  if (chatModal) {
    chatModal.classList.remove("hidden");

    if (!chatInputControl || !messageListControl) {
      const messageListContainer = document.querySelector(
        ".chat-message-list-container",
      );
      const inputContainer = document.querySelector(".chat-input-container");

      console.log("Chat initialization:", {
        messageListContainer,
        inputContainer,
        chatInputControl,
        messageListControl,
      });

      if (messageListContainer && inputContainer) {
        messageListControl = messageList(
          messageListContainer,
          chatStateManager,
        );

        let apiKey = import.meta.env.LONGCAT_API_KEY || "";
        try {
          const configModule = await import("./config.js");
          apiKey = configModule.config.longcatApiKey;
        } catch (error) {
          console.warn("config.js not found, using environment variables");
        }

        console.log(
          "Creating chatInput with apiKey:",
          apiKey ? "present" : "missing",
        );
        chatInputControl = chatInput(inputContainer, chatStateManager, apiKey);
        console.log("chatInput created:", chatInputControl);

        chatStateManager.onMessageAdded(() => {
          if (messageListControl) {
            messageListControl.refresh();
          }
        });
      } else {
        console.error("Chat containers not found:", {
          messageListContainer,
          inputContainer,
        });
      }
    }

    if (messageListControl) {
      messageListControl.refresh();
    }
  }
}

function closeChatModal() {
  const chatModal = document.getElementById("chat-modal-overlay");
  if (chatModal) {
    chatModal.classList.add("hidden");
  }
}

function handleChatModalOverlayClick(event) {
  if (event.target.id === "chat-modal-overlay") {
    closeChatModal();
  }
}

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    const chatModal = document.getElementById("chat-modal-overlay");
    if (chatModal && !chatModal.classList.contains("hidden")) {
      closeChatModal();
    }
  }
}
