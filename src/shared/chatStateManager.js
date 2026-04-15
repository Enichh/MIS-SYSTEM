/**
 * @fileoverview Chat state manager with localStorage persistence
 * @module shared/chatStateManager
 */

/**
 * Generates a unique message ID
 * @returns {string} Unique identifier for a message
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Chat message structure
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message identifier
 * @property {'user'|'assistant'} role - Message role
 * @property {string} content - Message content
 * @property {number} timestamp - Unix timestamp
 */

/**
 * Manages chat message history and state with localStorage persistence
 * @class
 */
class ChatStateManager {
  /**
   * Creates a new ChatStateManager instance
   * @param {string} storageKey - localStorage key for persistence
   */
  constructor(storageKey) {
    if (!storageKey || typeof storageKey !== 'string') {
      throw new Error('Storage key must be a non-empty string');
    }
    this.storageKey = storageKey;
    this.messages = [];
    this.loadFromStorage();
  }

  /**
   * Adds a message to the chat history
   * @param {'user'|'assistant'} role - Message role
   * @param {string} content - Message content
   * @returns {ChatMessage} The added message object
   * @example
   * const manager = new ChatStateManager('chat_history');
   * const msg = manager.addMessage('user', 'Hello');
   */
  addMessage(role, content) {
    if (role !== 'user' && role !== 'assistant') {
      throw new Error('Role must be either "user" or "assistant"');
    }
    if (!content || typeof content !== 'string') {
      throw new Error('Content must be a non-empty string');
    }

    const message = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.persistToStorage();
    return message;
  }

  /**
   * Retrieves the entire chat history
   * @returns {ChatMessage[]} Array of all messages in chronological order
   * @example
   * const manager = new ChatStateManager('chat_history');
   * const history = manager.getHistory();
   */
  getHistory() {
    return [...this.messages];
  }

  /**
   * Clears all messages from the chat history
   * @returns {void}
   * @example
   * const manager = new ChatStateManager('chat_history');
   * manager.clearHistory();
   */
  clearHistory() {
    this.messages = [];
    this.persistToStorage();
  }

  /**
   * Persists the current message history to localStorage
   * @returns {void}
   * @example
   * const manager = new ChatStateManager('chat_history');
   * manager.persistToStorage();
   */
  persistToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch (error) {
      console.error(`Failed to persist chat history: ${error.message}`);
    }
  }

  /**
   * Loads message history from localStorage
   * @returns {void}
   * @private
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.messages = parsed;
        }
      }
    } catch (error) {
      console.error(`Failed to load chat history: ${error.message}`);
      this.messages = [];
    }
  }
}

/**
 * Initializes a chat state manager with the specified storage key
 * @param {string} storageKey - localStorage key for persistence
 * @returns {ChatStateManager} Initialized ChatStateManager instance
 * @example
 * const chatManager = initializeChatState('chat_history');
 */
function initializeChatState(storageKey) {
  return new ChatStateManager(storageKey);
}

export { ChatStateManager, initializeChatState };
