/**
 * @fileoverview Validation functions and type guards for Enosoft Project Management System
 * @module shared/validators
 */

import { Employee, Project, Task } from './models.js';

/**
 * Work type constant for onsite
 * @constant {string}
 */
export const WORK_TYPE_ONSITE = 'onsite';

/**
 * Work type constant for work from home
 * @constant {string}
 */
export const WORK_TYPE_WFH = 'wfh';

/**
 * Email validation regex pattern
 * @constant {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Employee ID validation regex pattern
 * @constant {RegExp}
 */
const EMPLOYEE_ID_REGEX = /^emp_[a-z0-9]{12}$/;

/**
 * Project ID validation regex pattern
 * @constant {RegExp}
 */
const PROJECT_ID_REGEX = /^prj_[a-z0-9]{12}$/;

/**
 * Task ID validation regex pattern
 * @constant {RegExp}
 */
const TASK_ID_REGEX = /^tsk_[a-z0-9]{12}$/;

/**
 * Validates an employee object
 * @param {*} employee - The employee object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result with errors array
 */
function validateEmployee(employee) {
  const errors = [];

  if (!employee || typeof employee !== 'object') {
    return { valid: false, errors: ['Employee must be an object'] };
  }

  // Check required fields
  if (typeof employee.id !== 'string') {
    errors.push('Employee id must be a string');
  } else if (!EMPLOYEE_ID_REGEX.test(employee.id)) {
    errors.push('Employee id must match pattern emp_[a-z0-9]{12}');
  }

  if (typeof employee.name !== 'string') {
    errors.push('Employee name must be a string');
  } else if (employee.name.length < 1 || employee.name.length > 100) {
    errors.push('Employee name must be between 1 and 100 characters');
  }

  if (typeof employee.email !== 'string') {
    errors.push('Employee email must be a string');
  } else if (!EMAIL_REGEX.test(employee.email)) {
    errors.push('Employee email must be a valid email address');
  }

  if (typeof employee.workType !== 'string') {
    errors.push('Employee workType must be a string');
  } else if (employee.workType !== WORK_TYPE_ONSITE && employee.workType !== WORK_TYPE_WFH) {
    errors.push('Employee workType must be either onsite or wfh');
  }

  if (typeof employee.createdAt !== 'number') {
    errors.push('Employee createdAt must be a number');
  }

  if (typeof employee.updatedAt !== 'number') {
    errors.push('Employee updatedAt must be a number');
  }

  // Check optional fields
  if (employee.assignedProjects !== undefined) {
    if (!Array.isArray(employee.assignedProjects)) {
      errors.push('Employee assignedProjects must be an array');
    } else if (!employee.assignedProjects.every(item => typeof item === 'string')) {
      errors.push('Employee assignedProjects must contain only strings');
    }
  }

  if (employee.assignedTasks !== undefined) {
    if (!Array.isArray(employee.assignedTasks)) {
      errors.push('Employee assignedTasks must be an array');
    } else if (!employee.assignedTasks.every(item => typeof item === 'string')) {
      errors.push('Employee assignedTasks must contain only strings');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a project object
 * @param {*} project - The project object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result with errors array
 */
function validateProject(project) {
  const errors = [];

  if (!project || typeof project !== 'object') {
    return { valid: false, errors: ['Project must be an object'] };
  }

  // Check required fields
  if (typeof project.id !== 'string') {
    errors.push('Project id must be a string');
  } else if (!PROJECT_ID_REGEX.test(project.id)) {
    errors.push('Project id must match pattern prj_[a-z0-9]{12}');
  }

  if (typeof project.name !== 'string') {
    errors.push('Project name must be a string');
  } else if (project.name.length < 1 || project.name.length > 200) {
    errors.push('Project name must be between 1 and 200 characters');
  }

  if (typeof project.status !== 'string') {
    errors.push('Project status must be a string');
  } else if (!['active', 'completed', 'archived'].includes(project.status)) {
    errors.push('Project status must be active, completed, or archived');
  }

  if (typeof project.createdAt !== 'number') {
    errors.push('Project createdAt must be a number');
  }

  if (typeof project.updatedAt !== 'number') {
    errors.push('Project updatedAt must be a number');
  }

  // Check optional fields
  if (project.description !== undefined && typeof project.description !== 'string') {
    errors.push('Project description must be a string');
  } else if (project.description !== undefined && project.description.length > 1000) {
    errors.push('Project description must be at most 1000 characters');
  }

  if (project.assignedEmployees !== undefined) {
    if (!Array.isArray(project.assignedEmployees)) {
      errors.push('Project assignedEmployees must be an array');
    } else if (!project.assignedEmployees.every(item => typeof item === 'string')) {
      errors.push('Project assignedEmployees must contain only strings');
    }
  }

  if (project.tasks !== undefined) {
    if (!Array.isArray(project.tasks)) {
      errors.push('Project tasks must be an array');
    } else if (!project.tasks.every(item => typeof item === 'string')) {
      errors.push('Project tasks must contain only strings');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a task object
 * @param {*} task - The task object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result with errors array
 */
function validateTask(task) {
  const errors = [];

  if (!task || typeof task !== 'object') {
    return { valid: false, errors: ['Task must be an object'] };
  }

  // Check required fields
  if (typeof task.id !== 'string') {
    errors.push('Task id must be a string');
  } else if (!TASK_ID_REGEX.test(task.id)) {
    errors.push('Task id must match pattern tsk_[a-z0-9]{12}');
  }

  if (typeof task.projectId !== 'string') {
    errors.push('Task projectId must be a string');
  } else if (!PROJECT_ID_REGEX.test(task.projectId)) {
    errors.push('Task projectId must match pattern prj_[a-z0-9]{12}');
  }

  if (typeof task.title !== 'string') {
    errors.push('Task title must be a string');
  } else if (task.title.length < 1 || task.title.length > 200) {
    errors.push('Task title must be between 1 and 200 characters');
  }

  if (typeof task.status !== 'string') {
    errors.push('Task status must be a string');
  } else if (!['pending', 'in-progress', 'completed'].includes(task.status)) {
    errors.push('Task status must be pending, in-progress, or completed');
  }

  if (typeof task.createdAt !== 'number') {
    errors.push('Task createdAt must be a number');
  }

  if (typeof task.updatedAt !== 'number') {
    errors.push('Task updatedAt must be a number');
  }

  // Check optional fields
  if (task.description !== undefined && typeof task.description !== 'string') {
    errors.push('Task description must be a string');
  } else if (task.description !== undefined && task.description.length > 1000) {
    errors.push('Task description must be at most 1000 characters');
  }

  if (task.assignedEmployees !== undefined) {
    if (!Array.isArray(task.assignedEmployees)) {
      errors.push('Task assignedEmployees must be an array');
    } else if (!task.assignedEmployees.every(item => typeof item === 'string')) {
      errors.push('Task assignedEmployees must contain only strings');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard to check if an object is an Employee
 * @param {*} obj - The object to check
 * @returns {boolean} True if the object is an Employee
 */
function isEmployee(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const result = validateEmployee(obj);
  return result.valid;
}

/**
 * Type guard to check if an object is a Project
 * @param {*} obj - The object to check
 * @returns {boolean} True if the object is a Project
 */
function isProject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const result = validateProject(obj);
  return result.valid;
}

/**
 * Type guard to check if an object is a Task
 * @param {*} obj - The object to check
 * @returns {boolean} True if the object is a Task
 */
function isTask(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const result = validateTask(obj);
  return result.valid;
}

export {
  validateEmployee,
  validateProject,
  validateTask,
  isEmployee,
  isProject,
  isTask
};
