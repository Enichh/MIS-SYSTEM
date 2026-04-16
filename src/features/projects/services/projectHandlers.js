import {
  createProject,
  updateProject,
  deleteProject,
  getProject,
  assignEmployeeToProject,
  removeEmployeeFromProject,
  getAllEmployees,
} from "../../../shared/services/database.js";
import { validateProject } from "../../../shared/services/validators.js";
import { generateId } from "../../../shared/utils/models.js";

/**
 * Handle project form submission (create or update)
 * @param {FormData} formData - Form data
 * @param {string} mode - 'create' or 'edit'
 * @param {string} [id] - Project ID for edit mode
 * @returns {Promise<void>}
 */
export async function handleProjectFormSubmit(formData, mode, id) {
  try {
    let data;

    if (mode === "create") {
      data = {
        id: generateId(),
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
    } else if (mode === "edit") {
      data = await getProject(id);
      if (!data) {
        throw new Error("Project not found");
      }
      data.name = formData.get("name");
      data.description = formData.get("description");
      data.status = formData.get("status");
      data.updatedAt = Date.now();

      const validation = validateProject(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      await updateProject(data);
    }
  } catch (error) {
    throw new Error(`Failed to handle project form: ${error.message}`);
  }
}

/**
 * Handle project deletion
 * @param {string} id - Project ID
 * @returns {Promise<void>}
 */
export async function handleProjectDelete(id) {
  try {
    await deleteProject(id);
  } catch (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

/**
 * Handle employee assignment to project
 * @param {string} projectId - Project ID
 * @param {FormData} formData - Form data with selected employees
 * @returns {Promise<void>}
 */
export async function handleProjectAssignment(projectId, formData) {
  try {
    const selectedEmployees = formData.getAll("employees");
    const project = await getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    const currentAssignments = project.assignedEmployees || [];

    for (const employeeId of selectedEmployees) {
      if (!currentAssignments.includes(employeeId)) {
        await assignEmployeeToProject(employeeId, projectId);
      }
    }

    for (const employeeId of currentAssignments) {
      if (!selectedEmployees.includes(employeeId)) {
        await removeEmployeeFromProject(employeeId, projectId);
      }
    }
  } catch (error) {
    throw new Error(`Failed to handle project assignment: ${error.message}`);
  }
}

/**
 * Get all employees for assignment dropdown
 * @returns {Promise<Array>} Array of employees
 */
export async function getEmployeesForAssignment() {
  try {
    return await getAllEmployees();
  } catch (error) {
    throw new Error(`Failed to get employees for assignment: ${error.message}`);
  }
}
