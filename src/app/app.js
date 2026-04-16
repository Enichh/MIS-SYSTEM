/**
 * @fileoverview Main application entry point
 * @module app/app
 */

import "./global-styles.js";
import { setupNavigation } from "./router.js";
import {
  initializeTheme,
  initializeChat,
  initializeApi,
  initializeDatabase,
  getChatStateManager,
  getApiClient,
} from "./providers.js";
import { initializeFormHandlers, handleDocumentClick, setupFormEventListeners } from "./formHandlers.js";
import { renderEmployees } from "../features/employees/index.js";
import { renderProjects } from "../features/projects/index.js";
import { renderTasks } from "../features/tasks/index.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    initializeTheme();
    await initializeDatabase();
    await initializeApi();
    
    // Initialize form handlers with dependencies
    initializeFormHandlers(getChatStateManager, getApiClient);
    
    // Render all features
    await renderEmployees();
    await renderProjects();
    await renderTasks();
    
    // Setup navigation and event listeners
    setupNavigation();
    setupFormEventListeners();
    document.addEventListener("click", handleDocumentClick);
    
    // Initialize chat
    initializeChat();
  } catch (error) {
    showNotification(error.message, "error");
  }
});

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error)
 */
function showNotification(message, type) {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove("hidden");

    setTimeout(() => {
      notification.classList.add("hidden");
    }, 3000);
  }
}
