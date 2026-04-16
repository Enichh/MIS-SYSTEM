/**
 * @fileoverview Constants and configuration for LONGCAT API and Netlify deployment
 * @module shared/constants
 */

/**
 * API base URL for Netlify Functions
 * @constant {string}
 */
export const API_BASE_URL = '/.netlify/functions';

/**
 * Knowledge query endpoints
 * @constant {object}
 */
export const KNOWLEDGE_ENDPOINTS = {
  QUERY: '/.netlify/functions/knowledge-query',
  PROJECTS: '/.netlify/functions/project-data',
  EMPLOYEES: '/.netlify/functions/employee-data',
  TASKS: '/.netlify/functions/task-data'
};

/**
 * localStorage key for chat history persistence
 * @constant {string}
 */
export const CHAT_STORAGE_KEY = 'mis_chat_history';

/**
 * Netlify deployment configuration
 * @constant {object}
 */
export const netlifyConfig = {
  build: {
    command: 'echo "No build step required for vanilla JS"',
    publish: '.'
  },
  functions: {
    directory: 'netlify/functions'
  },
  redirects: [
    {
      from: '/*',
      to: '/index.html',
      status: 200
    }
  ]
};
