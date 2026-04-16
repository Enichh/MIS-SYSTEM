/**
 * @fileoverview Chat input component with API integration and keyboard handling
 * @module frontend-components/chatInput
 */

import { queryKnowledge } from "../shared/apiClient.js";

/**
 * Renders the chat input component with Netlify Functions integration
 * @param {HTMLElement} container - Container element to render the input in
 * @param {ChatStateManager} chatStateManager - Chat state manager instance
 * @returns {Object} Component control object
 */
function chatInput(container, chatStateManager) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("Container must be a valid HTMLElement");
  }

  if (!chatStateManager || typeof chatStateManager !== "object") {
    throw new Error("chatStateManager must be a valid object");
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

      const knowledgeQuery = {
        query: message,
        context: {
          timestamp: new Date().toISOString(),
        },
      };

      const response = await queryKnowledge(knowledgeQuery);
      const assistantMessage = chatStateManager.addMessage(
        "assistant",
        response.answer,
      );
      assistantMessage.knowledgeData = response;
    } catch (error) {
      console.error("[DEBUG] Failed to send message:", error);
      console.error("[DEBUG] Error message:", error.message);
      console.error("[DEBUG] Error stack:", error.stack);
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
