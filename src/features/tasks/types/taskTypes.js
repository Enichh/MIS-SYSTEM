/**
 * @fileoverview Task type definitions matching schema.json
 * @module features/tasks/types/taskTypes
 */

/**
 * @typedef {Object} TaskDTO
 * @property {string} id - Unique task identifier
 * @property {string} projectId - Associated project ID
 * @property {string} title - Task title
 * @property {string} [description] - Task description
 * @property {"pending"|"in-progress"|"completed"} status - Task status
 * @property {string[]} [assignedEmployees] - Array of assigned employee IDs
 * @property {number} [createdAt] - Creation timestamp
 * @property {number} [updatedAt] - Last update timestamp
 */

export {};
