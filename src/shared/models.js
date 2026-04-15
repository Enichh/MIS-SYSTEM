/**
 * @fileoverview Data models and type definitions for Enosoft Project Management System
 * @module shared/models
 */

/**
 * @typedef {string} WorkType
 * Work type enumeration for employees
 * @example
 * const workType = 'onsite'; // or 'wfh'
 */

/**
 * @typedef {Object} Employee
 * Employee data model
 * @property {string} id - Employee ID matching pattern ^emp_[a-z0-9]{12}$
 * @property {string} name - Employee name (1-100 characters)
 * @property {string} email - Employee email address
 * @property {WorkType} workType - Work type: 'onsite' or 'wfh'
 * @property {string[]} assignedProjects - Array of project IDs assigned to employee
 * @property {string[]} assignedTasks - Array of task IDs assigned to employee
 * @property {number} createdAt - Unix timestamp of creation
 * @property {number} updatedAt - Unix timestamp of last update
 * @example
 * const employee = {
 *   id: 'emp_abc123def456',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   workType: 'onsite',
 *   assignedProjects: [],
 *   assignedTasks: [],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * };
 */

/**
 * @typedef {Object} Project
 * Project data model
 * @property {string} id - Project ID matching pattern ^prj_[a-z0-9]{12}$
 * @property {string} name - Project name (1-200 characters)
 * @property {string} [description] - Project description (max 1000 characters)
 * @property {'active'|'completed'|'archived'} status - Project status
 * @property {string[]} assignedEmployees - Array of employee IDs assigned to project
 * @property {string[]} tasks - Array of task IDs belonging to project
 * @property {number} createdAt - Unix timestamp of creation
 * @property {number} updatedAt - Unix timestamp of last update
 * @example
 * const project = {
 *   id: 'prj_abc123def456',
 *   name: 'Website Redesign',
 *   description: 'Complete redesign of company website',
 *   status: 'active',
 *   assignedEmployees: [],
 *   tasks: [],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * };
 */

/**
 * @typedef {Object} Task
 * Task data model
 * @property {string} id - Task ID matching pattern ^tsk_[a-z0-9]{12}$
 * @property {string} projectId - Parent project ID matching pattern ^prj_[a-z0-9]{12}$
 * @property {string} title - Task title (1-200 characters)
 * @property {string} [description] - Task description (max 1000 characters)
 * @property {'pending'|'in-progress'|'completed'} status - Task status
 * @property {string[]} assignedEmployees - Array of employee IDs assigned to task
 * @property {number} createdAt - Unix timestamp of creation
 * @property {number} updatedAt - Unix timestamp of last update
 * @example
 * const task = {
 *   id: 'tsk_abc123def456',
 *   projectId: 'prj_xyz789ghi012',
 *   title: 'Design homepage',
 *   description: 'Create mockups for homepage',
 *   status: 'pending',
 *   assignedEmployees: [],
 *   createdAt: Date.now(),
 *   updatedAt: Date.now()
 * };
 */

/**
 * Generates a unique ID with the specified prefix
 * Pattern: [prefix]_[12 lowercase alphanumeric characters]
 * @param {string} prefix - The ID prefix (e.g., 'emp', 'prj', 'tsk')
 * @returns {string} A unique ID matching the pattern ^[a-z]{3}_[a-z0-9]{12}$
 * @example
 * generateId('emp'); // returns 'emp_abc123def456'
 * generateId('prj'); // returns 'prj_xyz789ghi012'
 */
function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < 12; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${randomPart}`;
}

export { Employee, Project, Task, WorkType, generateId };
