/**
 * @fileoverview Type definitions for AI Knowledge System
 * @module shared/types
 */

/**
 * @typedef {Object} ProjectDTO
 * @property {string} id - Project unique identifier
 * @property {string} name - Project name
 * @property {string} [description] - Project description
 * @property {'active'|'completed'|'on_hold'} status - Project status
 * @property {string} [startDate] - Project start date (ISO date format)
 * @property {string} [endDate] - Project end date (ISO date format)
 */

/**
 * @typedef {Object} EmployeeDTO
 * @property {string} id - Employee unique identifier
 * @property {string} name - Employee full name
 * @property {string} email - Employee email address
 * @property {string} role - Employee role/title
 * @property {string} [department] - Employee department
 * @property {string[]} [projects] - List of project IDs employee is assigned to
 */

/**
 * @typedef {Object} TaskDTO
 * @property {string} id - Task unique identifier
 * @property {string} title - Task title
 * @property {string} [description] - Task description
 * @property {'pending'|'in_progress'|'completed'} status - Task status
 * @property {string} projectId - ID of the project this task belongs to
 * @property {string} [assignedTo] - ID of employee assigned to this task
 * @property {string} [dueDate] - Task due date (ISO date format)
 */

/**
 * @typedef {Object} KnowledgeQuery
 * @property {string} query - The user's question or query
 * @property {Object} [context] - Optional context for the query
 * @property {string} [context.projectId] - Project ID for context
 * @property {string} [context.employeeId] - Employee ID for context
 * @property {string} [context.taskId] - Task ID for context
 */

/**
 * @typedef {Object} KnowledgeResponse
 * @property {string} answer - The AI-generated answer
 * @property {string[]} [sources] - List of source references
 * @property {number} [confidence] - Confidence score (0-1)
 * @property {Object} [relatedEntities] - Related entities (projects, employees, tasks)
 */
