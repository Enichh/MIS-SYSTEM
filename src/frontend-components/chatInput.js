/**
 * @fileoverview Chat input component with API integration and keyboard handling
 * @module frontend-components/chatInput
 */

import { longcatApiClient, queryEmployeeData } from "../shared/apiClient.js";
import { config } from "../config.js";

/**
 * Renders the chat input component with send functionality
 * @param {HTMLElement} container - Container element to render the input in
 * @param {ChatStateManager} chatStateManager - Chat state manager instance
 * @param {string} apiKey - LONGCAT API key for authentication (optional, uses config if not provided)
 * @returns {Object} Component control object
 */
function chatInput(container, chatStateManager, apiKey = config.longcatApiKey) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("Container must be a valid HTMLElement");
  }

  if (!chatStateManager || typeof chatStateManager !== "object") {
    throw new Error("chatStateManager must be a valid object");
  }

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error(
      "API key must be a non-empty string. Set it in src/config.js for local development or as environment variable for Netlify.",
    );
  }

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "chat-input-wrapper";
  container.appendChild(inputWrapper);

  const textarea = document.createElement("textarea");
  textarea.className = "chat-input-textarea";
  textarea.placeholder = "Type your message...";
  textarea.rows = 1;
  textarea.setAttribute("aria-label", "Chat message input");
  inputWrapper.appendChild(textarea);

  const sendButton = document.createElement("button");
  sendButton.className = "chat-input-send";
  sendButton.textContent = "Send";
  sendButton.setAttribute("aria-label", "Send message");
  sendButton.disabled = true;
  inputWrapper.appendChild(sendButton);

  let isSending = false;

  function autoResize() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!isSending && textarea.value.trim()) {
        sendMessage();
      }
    }
  }

  function updateSendButton() {
    sendButton.disabled = isSending || !textarea.value.trim();
  }

  async function sendMessage() {
    const message = textarea.value.trim();
    if (!message || isSending) {
      return;
    }

    isSending = true;
    updateSendButton();
    sendButton.textContent = "Sending...";

    try {
      chatStateManager.addMessage("user", message);
      textarea.value = "";
      autoResize();

      const employeeData = await queryEmployeeData("");
      const context = {
        employeeCount: employeeData.length,
        timestamp: new Date().toISOString(),
      };

      const response = await longcatApiClient(apiKey, message, context);
      chatStateManager.addMessage("assistant", response.response);
    } catch (error) {
      console.error("Failed to send message:", error);
      chatStateManager.addMessage(
        "assistant",
        "Sorry, I encountered an error. Please try again.",
      );
    } finally {
      isSending = false;
      sendButton.textContent = "Send";
      updateSendButton();
    }
  }

  textarea.addEventListener("input", () => {
    autoResize();
    updateSendButton();
  });

  textarea.addEventListener("keydown", handleKeyDown);

  sendButton.addEventListener("click", sendMessage);

  return {
    focus: () => textarea.focus(),
    disable: () => {
      textarea.disabled = true;
      sendButton.disabled = true;
    },
    enable: () => {
      textarea.disabled = false;
      updateSendButton();
    },
  };
}

export { chatInput };
