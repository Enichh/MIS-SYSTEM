import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
  removeEmployeeFromProject,
} from "../../../shared/services/database.js";
import { validateEmployee } from "../../../shared/services/validators.js";
import { generateId } from "../../../shared/utils/models.js";

/**
 * Handle employee form submission (create or update)
 * @param {FormData} formData - Form data
 * @param {string} mode - 'create' or 'edit'
 * @param {string} [id] - Employee ID for edit mode
 * @returns {Promise<void>}
 */
export async function handleEmployeeFormSubmit(formData, mode, id) {
  try {
    let data;

    if (mode === "create") {
      data = {
        id: generateId(),
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
    } else if (mode === "edit") {
      data = await getEmployee(id);
      if (!data) {
        throw new Error("Employee not found");
      }
      data.name = formData.get("name");
      data.email = formData.get("email");
      data.workType = formData.get("workType");
      data.updatedAt = Date.now();

      const validation = validateEmployee(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      await updateEmployee(data);
    }
  } catch (error) {
    throw new Error(`Failed to handle employee form: ${error.message}`);
  }
}

/**
 * Handle employee deletion
 * @param {string} id - Employee ID
 * @returns {Promise<void>}
 */
export async function handleEmployeeDelete(id) {
  try {
    await deleteEmployee(id);
  } catch (error) {
    throw new Error(`Failed to delete employee: ${error.message}`);
  }
}

/**
 * Handle removing employee from project
 * @param {string} employeeId - Employee ID
 * @param {string} projectId - Project ID
 * @returns {Promise<void>}
 */
export async function handleRemoveEmployeeFromProject(employeeId, projectId) {
  try {
    await removeEmployeeFromProject(employeeId, projectId);
  } catch (error) {
    throw new Error(`Failed to remove employee from project: ${error.message}`);
  }
}
