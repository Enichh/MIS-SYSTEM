/**
 * @fileoverview Public API exports for shared services
 * @module shared/services
 */

export {
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
} from "./database.js";

export {
  validateEmployee,
  validateProject,
  validateTask,
  WORK_TYPE_ONSITE,
  WORK_TYPE_WFH,
} from "./validators.js";

export {
  queryKnowledge,
  initializeApiClient,
} from "./apiClient.js";
