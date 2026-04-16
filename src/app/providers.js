/**
 * @fileoverview Providers handle theme and chat initialization
 * @module app/providers
 */

import {
  ThemeToggle,
  initializeThemeManager,
} from "../features/chat/index.js";
import {
  ChatStateManager,
  initializeChatState,
} from "../shared/utils/index.js";
import { initializeApiClient } from "../shared/services/index.js";
import { openDatabase } from "../shared/services/index.js";
import { retry } from "./retry.js";

let chatStateManager = null;
let apiClient = null;
let themeToggle = null;
let db = null;

/**
 * Initialize theme manager
 */
export function initializeTheme() {
  initializeThemeManager();
  const themeToggleContainer = document.getElementById(
    "theme-toggle-container",
  );
  if (themeToggleContainer) {
    themeToggle = new ThemeToggle(themeToggleContainer);
  }
}

/**
 * Initialize chat state
 * @returns {ChatStateManager} Chat state manager instance
 */
export function initializeChat() {
  chatStateManager = initializeChatState("enosoft_chat_history");

  const history = chatStateManager.getHistory();
  if (history.length === 0) {
    chatStateManager.addMessage(
      "assistant",
      "Hello! This is the AI assistant for the Enosoft Project Management System. How can I help you today?",
    );
  }

  return chatStateManager;
}

/**
 * Initialize API client with retry logic
 * @param {Object} options - API client options
 * @returns {Promise<Object>} API client instance
 */
export async function initializeApi(options = {}) {
  apiClient = await retry(
    () => initializeApiClient({ timeout: 30000, ...options }),
    { maxRetries: 3, baseDelay: 1000 },
  );
  return apiClient;
}

/**
 * Initialize database with retry logic
 * @returns {Promise<Object>} Database instance
 */
export async function initializeDatabase() {
  db = await retry(
    () => openDatabase(),
    { maxRetries: 3, baseDelay: 1000 },
  );
  return db;
}

/**
 * Get chat state manager
 * @returns {ChatStateManager} Chat state manager instance
 */
export function getChatStateManager() {
  return chatStateManager;
}

/**
 * Get API client
 * @returns {Object} API client instance
 */
export function getApiClient() {
  return apiClient;
}

/**
 * Get theme toggle instance
 * @returns {ThemeToggle} Theme toggle instance
 */
export function getThemeToggle() {
  return themeToggle;
}

/**
 * Get database instance
 * @returns {Object} Database instance
 */
export function getDatabase() {
  return db;
}
