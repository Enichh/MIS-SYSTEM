/**
 * Employee type definitions
 * Matches schema.json EmployeeDTO
 */

/**
 * @typedef {Object} EmployeeDTO
 * @property {string} id - Unique identifier
 * @property {string} name - Employee name
 * @property {string} email - Employee email (must be valid email format)
 * @property {'onsite'|'wfh'} workType - Work type (onsite or work from home)
 * @property {string[]} assignedProjects - Array of project IDs
 * @property {string[]} assignedTasks - Array of task IDs
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

export { EmployeeDTO };
