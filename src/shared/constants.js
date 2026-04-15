/**
 * @fileoverview Constants and configuration for LONGCAT API and Netlify deployment
 * @module shared/constants
 */

/**
 * LONGCAT API base URL
 * @constant {string}
 */
export const LONGCAT_API_BASE_URL = 'https://api.longcat.chat/openai/v1/chat/completions';

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
