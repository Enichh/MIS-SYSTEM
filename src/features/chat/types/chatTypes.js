/**
 * @fileoverview Chat type definitions
 * @module features/chat/types/chatTypes
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message identifier
 * @property {'user'|'assistant'} role - Message role
 * @property {string} content - Message content
 * @property {number} timestamp - Unix timestamp
 * @property {Object} [knowledgeData] - Optional knowledge response data
 */

/**
 * @typedef {Object} KnowledgeData
 * @property {string} answer - The answer text
 * @property {number} confidence - Confidence score (0-1)
 * @property {string[]} [sources] - Array of source references
 * @property {Object} [relatedEntities] - Related entity data
 */

export {};
