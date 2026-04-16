/**
 * @fileoverview Form handlers for modal and CRUD operations
 * @module app/formHandlers
 */

import {
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
} from "../shared/services/index.js";
import {
  validateEmployee,
  validateProject,
  validateTask,
  WORK_TYPE_ONSITE,
  WORK_TYPE_WFH,
} from "../shared/services/index.js";
import { generateId } from "../shared/utils/index.js";
import { getCurrentSection } from "./router.js";

// Constants for section names
export const SECTIONS = {
  EMPLOYEES: "employees",
  PROJECTS: "projects",
  TASKS: "tasks",
};

// Constants for entity types
export const ENTITY_TYPES = {
  EMPLOYEE: "employee",
  PROJECT: "project",
  TASK: "task",
};

let chatInputControl = null;
let messageListControl = null;
let getChatStateManagerFn = null;
let getApiClientFn = null;

/**
 * Initialize form handlers with dependencies
 * @param {Function} getChatStateManager - Function to get chat state manager
 * @param {Function} getApiClient - Function to get API client
 */
export function initializeFormHandlers(getChatStateManager, getApiClient) {
  getChatStateManagerFn = getChatStateManager;
  getApiClientFn = getApiClient;
}

/**
 * Setup event listeners for forms and modals
 */
export function setupFormEventListeners() {
  const modalClose = document.getElementById("modal-close");
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  const modalForm = document.getElementById("modal-form");
  if (modalForm) {
    modalForm.addEventListener("submit", handleFormSubmit);
  }

  const fabButton = document.getElementById("fab-button");
  if (fabButton) {
    fabButton.addEventListener("click", openChatModal);
  }

  const chatModalClose = document.getElementById("chat-modal-close");
  if (chatModalClose) {
    chatModalClose.addEventListener("click", closeChatModal);
  }

  const chatModalOverlay = document.getElementById("chat-modal-overlay");
  if (chatModalOverlay) {
    chatModalOverlay.addEventListener("click", handleChatModalOverlayClick);
  }

  document.addEventListener("keydown", handleEscapeKey);
}

/**
 * Handle document click events for data actions
 * @param {Event} event - Click event
 */
export async function handleDocumentClick(event) {
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
  } else if (action === "delete-chat") {
    await handleDeleteChat();
  }
}

/**
 * Open create modal for an entity
 * @param {string} entity - Entity type
 */
export function openCreateModal(entity) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  if (!modal || !title || !form) {
    console.error("Required modal elements not found");
    return;
  }

  title.textContent = `Add ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
  form.dataset.entity = entity;
  form.dataset.mode = "create";

  const formContent = generateFormContent(entity, "create");
  form.innerHTML = formContent;
  modal.classList.remove("hidden");

  if (entity === ENTITY_TYPES.TASK) {
    populateProjectSelect();
  }
}

/**
 * Open edit modal for an entity
 * @param {string} entity - Entity type
 * @param {string} id - Entity ID
 */
export async function openEditModal(entity, id) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  if (!modal || !title || !form) {
    console.error("Required modal elements not found");
    return;
  }

  title.textContent = `Edit ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
  form.dataset.entity = entity;
  form.dataset.mode = "edit";
  form.dataset.id = id;

  let data;
  if (entity === ENTITY_TYPES.EMPLOYEE) {
    data = await getEmployee(id);
  } else if (entity === ENTITY_TYPES.PROJECT) {
    data = await getProject(id);
  } else if (entity === ENTITY_TYPES.TASK) {
    data = await getTask(id);
  }

  if (!data) {
    showNotification(
      `${entity.charAt(0).toUpperCase() + entity.slice(1)} not found`,
      "error",
    );
    return;
  }

  const formContent = generateFormContent(entity, "edit", data);
  form.innerHTML = formContent;
  modal.classList.remove("hidden");

  if (entity === ENTITY_TYPES.TASK) {
    populateProjectSelect();
    const projectSelect = document.getElementById("task-projectId");
    if (projectSelect) {
      projectSelect.value = data.projectId;
    }
  }
}

/**
 * Open assignment modal
 * @param {string} type - Assignment type (project or task)
 * @param {string} id - Entity ID
 */
export async function openAssignmentModal(type, id) {
  const modal = document.getElementById("modal-overlay");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("modal-form");

  if (!modal || !title || !form) {
    console.error("Required modal elements not found");
    return;
  }

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  title.textContent = `Assign Employees to ${typeLabel}`;
  form.dataset.entity = "assignment";
  form.dataset.type = type;
  form.dataset.id = id;

  const employees = await getAllEmployees();
  const employeeOptions = employees
    .map(
      (emp) => `
    <option value="${emp.id}">${emp.name} (${emp.email})</option>
  `,
    )
    .join("");

  let formContent = `
    <div class="form-group">
      <label for="assignment-employees">Select Employees</label>
      <select id="assignment-employees" name="employees" multiple required>
        ${employeeOptions}
      </select>
    </div>
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn-primary">Save</button>
    </div>
  `;

  form.innerHTML = formContent;
  modal.classList.remove("hidden");

  const data = type === "project" ? await getProject(id) : await getTask(id);
  if (data && data.assignedEmployees) {
    const select = document.getElementById("assignment-employees");
    if (select) {
      data.assignedEmployees.forEach((empId) => {
        const option = select.querySelector(`option[value="${empId}"]`);
        if (option) option.selected = true;
      });
    }
  }
}

/**
 * Generate form content based on entity type and mode
 * @param {string} entity - Entity type
 * @param {string} mode - Form mode (create or edit)
 * @param {Object} data - Existing data for edit mode
 * @returns {string} Form HTML content
 */
function generateFormContent(entity, mode, data = null) {
  let formContent = "";

  if (entity === ENTITY_TYPES.EMPLOYEE) {
    formContent = generateEmployeeForm(mode, data);
  } else if (entity === ENTITY_TYPES.PROJECT) {
    formContent = generateProjectForm(mode, data);
  } else if (entity === ENTITY_TYPES.TASK) {
    formContent = generateTaskForm(mode, data);
  }

  formContent += `
    <div class="form-actions">
      <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button type="submit" class="btn-primary">Save</button>
    </div>
  `;

  return formContent;
}

/**
 * Generate employee form
 * @param {string} mode - Form mode
 * @param {Object} data - Existing data
 * @returns {string} Form HTML
 */
function generateEmployeeForm(mode, data) {
  const name = data?.name || "";
  const email = data?.email || "";
  const workType = data?.workType || "";

  return `
    <div class="form-group">
      <label for="employee-name">Name *</label>
      <input type="text" id="employee-name" name="name" value="${name}" required maxlength="100">
    </div>
    <div class="form-group">
      <label for="employee-email">Email *</label>
      <input type="email" id="employee-email" name="email" value="${email}" required maxlength="255">
    </div>
    <div class="form-group">
      <label for="employee-workType">Work Type *</label>
      <select id="employee-workType" name="workType" required>
        <option value="">Select work type</option>
        <option value="${WORK_TYPE_ONSITE}" ${workType === WORK_TYPE_ONSITE ? "selected" : ""}>Onsite</option>
        <option value="${WORK_TYPE_WFH}" ${workType === WORK_TYPE_WFH ? "selected" : ""}>Work From Home</option>
      </select>
    </div>
  `;
}

/**
 * Generate project form
 * @param {string} mode - Form mode
 * @param {Object} data - Existing data
 * @returns {string} Form HTML
 */
function generateProjectForm(mode, data) {
  const name = data?.name || "";
  const description = data?.description || "";
  const status = data?.status || "";

  return `
    <div class="form-group">
      <label for="project-name">Name *</label>
      <input type="text" id="project-name" name="name" value="${name}" required maxlength="100">
    </div>
    <div class="form-group">
      <label for="project-description">Description</label>
      <textarea id="project-description" name="description" maxlength="500">${description}</textarea>
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

/**
 * Generate task form
 * @param {string} mode - Form mode
 * @param {Object} data - Existing data
 * @returns {string} Form HTML
 */
function generateTaskForm(mode, data) {
  const projectId = data?.projectId || "";
  const title = data?.title || "";
  const description = data?.description || "";
  const status = data?.status || "";

  return `
    <div class="form-group">
      <label for="task-projectId">Project *</label>
      <select id="task-projectId" name="projectId" required>
        <option value="">Select project</option>
      </select>
    </div>
    <div class="form-group">
      <label for="task-title">Title *</label>
      <input type="text" id="task-title" name="title" value="${title}" required maxlength="100">
    </div>
    <div class="form-group">
      <label for="task-description">Description</label>
      <textarea id="task-description" name="description" maxlength="500">${description}</textarea>
    </div>
    <div class="form-group">
      <label for="task-status">Status *</label>
      <select id="task-status" name="status" required>
        <option value="">Select status</option>
        <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
        <option value="in-progress" ${status === "in-progress" ? "selected" : ""}>In Progress</option>
        <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
      </select>
    </div>
  `;
}

/**
 * Close modal
 */
export function closeModal() {
  const modal = document.getElementById("modal-overlay");
  if (modal) {
    modal.classList.add("hidden");
  }
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const entity = form.dataset.entity;
  const mode = form.dataset.mode;
  const formData = new FormData(form);

  try {
    if (entity === "assignment") {
      await handleAssignment(form.dataset.type, form.dataset.id, formData);
    } else {
      await handleEntitySubmit(entity, mode, formData);
    }

    closeModal();
    showNotification(
      `${entity.charAt(0).toUpperCase() + entity.slice(1)} ${mode === "create" ? "created" : "updated"} successfully`,
      "success",
    );
    await refreshCurrentSection();
  } catch (error) {
    showNotification(error.message, "error");
  }
}

/**
 * Handle entity form submission
 * @param {string} entity - Entity type
 * @param {string} mode - Form mode
 * @param {FormData} formData - Form data
 */
async function handleEntitySubmit(entity, mode, formData) {
  let data;

  if (mode === "create") {
    const id = generateId();
    if (entity === ENTITY_TYPES.EMPLOYEE) {
      data = {
        id,
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
    } else if (entity === ENTITY_TYPES.PROJECT) {
      data = {
        id,
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
    } else if (entity === ENTITY_TYPES.TASK) {
      data = {
        id,
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
  } else if (mode === "edit") {
    const id = form.dataset.id;
    if (entity === ENTITY_TYPES.EMPLOYEE) {
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
    } else if (entity === ENTITY_TYPES.PROJECT) {
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
    } else if (entity === ENTITY_TYPES.TASK) {
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
}

/**
 * Handle assignment form submission
 * @param {string} type - Assignment type
 * @param {string} id - Entity ID
 * @param {FormData} formData - Form data
 */
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

/**
 * Handle delete operation
 * @param {string} entity - Entity type
 * @param {string} id - Entity ID
 */
async function handleDelete(entity, id) {
  if (!confirm(`Are you sure you want to delete this ${entity}?`)) {
    return;
  }

  try {
    if (entity === ENTITY_TYPES.EMPLOYEE) {
      await deleteEmployee(id);
    } else if (entity === ENTITY_TYPES.PROJECT) {
      await deleteProject(id);
    } else if (entity === ENTITY_TYPES.TASK) {
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

/**
 * Handle remove from project
 * @param {string} employeeId - Employee ID
 * @param {string} projectId - Project ID
 */
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

/**
 * Handle remove from task
 * @param {string} employeeId - Employee ID
 * @param {string} taskId - Task ID
 */
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

/**
 * Handle delete chat history
 */
async function handleDeleteChat() {
  if (!confirm("Are you sure you want to delete all chat history?")) {
    return;
  }

  try {
    const chatStateManager = getChatStateManagerFn();
    if (chatStateManager) {
      chatStateManager.clearHistory();
      chatStateManager.addMessage(
        "assistant",
        "Hello! This is the AI assistant for the Enosoft Project Management System. How can I help you today?",
      );
      if (messageListControl) {
        messageListControl.refresh();
      }
      showNotification("Chat history deleted successfully", "success");
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

/**
 * Refresh current section
 */
async function refreshCurrentSection() {
  const section = getCurrentSection();
  const { renderEmployees } = await import("../features/employees/index.js");
  const { renderProjects } = await import("../features/projects/index.js");
  const { renderTasks } = await import("../features/tasks/index.js");

  if (section === SECTIONS.EMPLOYEES) {
    await renderEmployees();
  } else if (section === SECTIONS.PROJECTS) {
    await renderProjects();
  } else if (section === SECTIONS.TASKS) {
    await renderTasks();
  }
}

/**
 * Populate project select dropdown
 */
async function populateProjectSelect() {
  const projectSelect = document.getElementById("task-projectId");
  if (!projectSelect) return;

  const projects = await getAllProjects();
  projectSelect.innerHTML = `
    <option value="">Select project</option>
    ${projects
      .map(
        (p) => `
      <option value="${p.id}">${p.name}</option>
    `,
      )
      .join("")}
  `;
}

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error)
 */
function showNotification(message, type) {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove("hidden");

    setTimeout(() => {
      notification.classList.add("hidden");
    }, 3000);
  }
}

/**
 * Open chat modal
 */
async function openChatModal() {
  const chatModal = document.getElementById("chat-modal-overlay");
  if (chatModal) {
    chatModal.classList.remove("hidden");

    if (!chatInputControl || !messageListControl) {
      const messageListContainer = document.querySelector(
        ".chat-message-list-container",
      );
      const inputContainer = document.querySelector(".chat-input-container");
      const chatStateManager = getChatStateManagerFn();
      const apiClient = getApiClientFn();

      if (messageListContainer && inputContainer && chatStateManager) {
        const { messageList } = await import("../features/chat/index.js");
        const { chatInput } = await import("../features/chat/index.js");

        messageListControl = messageList(
          messageListContainer,
          chatStateManager,
        );

        chatInputControl = chatInput(inputContainer, chatStateManager);

        chatStateManager.onMessageAdded(() => {
          if (messageListControl) {
            messageListControl.refresh();
          }
        });
      }
    }

    if (messageListControl) {
      messageListControl.refresh();
    }
  }
}

/**
 * Close chat modal
 */
function closeChatModal() {
  const chatModal = document.getElementById("chat-modal-overlay");
  if (chatModal) {
    chatModal.classList.add("hidden");
  }
}

/**
 * Handle chat modal overlay click
 * @param {Event} event - Click event
 */
function handleChatModalOverlayClick(event) {
  if (event.target.id === "chat-modal-overlay") {
    closeChatModal();
  }
}

/**
 * Handle escape key
 * @param {Event} event - Key event
 */
function handleEscapeKey(event) {
  if (event.key === "Escape") {
    const chatModal = document.getElementById("chat-modal-overlay");
    if (chatModal && !chatModal.classList.contains("hidden")) {
      closeChatModal();
    }
  }
}

// Expose closeModal globally for onclick handlers
window.closeModal = closeModal;
