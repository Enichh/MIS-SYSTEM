/**
 * @fileoverview Task event handlers
 * @module features/tasks/services/taskHandlers
 */

import { generateId } from "../../../shared/utils/models.js";
import {
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../../../shared/services/database.js";
import { validateTask } from "../../../shared/services/validators.js";

/**
 * Handles task creation
 * @param {FormData} formData - Form data from task form
 * @returns {Promise<void>}
 */
async function handleTaskCreate(formData) {
  try {
    const data = {
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
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error;
  }
}

/**
 * Handles task update
 * @param {string} id - Task ID
 * @param {FormData} formData - Form data from task form
 * @returns {Promise<void>}
 */
async function handleTaskUpdate(id, formData) {
  try {
    const data = await getTask(id);
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
  } catch (error) {
    console.error("Failed to update task:", error);
    throw error;
  }
}

/**
 * Handles task deletion
 * @param {string} id - Task ID
 * @returns {Promise<void>}
 */
async function handleTaskDelete(id) {
  try {
    await deleteTask(id);
  } catch (error) {
    console.error("Failed to delete task:", error);
    throw error;
  }
}

export { handleTaskCreate, handleTaskUpdate, handleTaskDelete };
