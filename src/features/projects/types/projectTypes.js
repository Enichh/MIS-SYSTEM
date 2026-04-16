/**
 * Project type definitions
 * Matches schema.json ProjectDTO
 */

/**
 * @typedef {Object} ProjectDTO
 * @property {string} id - Unique identifier
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {'active'|'completed'|'archived'} status - Project status
 * @property {string[]} assignedEmployees - Array of employee IDs
 * @property {string[]} tasks - Array of task IDs
 * @property {number} createdAt - Timestamp of creation
 * @property {number} updatedAt - Timestamp of last update
 */

export { ProjectDTO };
