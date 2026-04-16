/**
 * @fileoverview Chat initialization service
 * @module features/chat/services/chatInitialization
 */

import { initializeChatState } from "../../../shared/utils/chatStateManager.js";

/**
 * Initializes chat with default message
 * @param {string} storageKey - Storage key for chat history
 * @returns {ChatStateManager} Chat state manager instance
 */
function initializeChat(storageKey) {
  try {
    const chatStateManager = initializeChatState(storageKey);

    const history = chatStateManager.getHistory();
    if (history.length === 0) {
      chatStateManager.addMessage(
        "assistant",
        "Hello! This is the AI assistant for the Enosoft Project Management System. How can I help you today?",
      );
    }

    return chatStateManager;
  } catch (error) {
    console.error("Failed to initialize chat:", error);
    throw error;
  }
}

export { initializeChat };
