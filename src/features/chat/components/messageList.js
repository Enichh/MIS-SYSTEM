/**
 * @fileoverview Message history component with auto-scroll and state handling
 * @module frontend-components/messageList
 */

import { ChatStateManager } from "../../../shared/utils/chatStateManager.js";
import { chatMessage } from "./chatMessage.js";
import { parseBasicMarkdown } from "../../../shared/utils/markdown.js";

/**
 * Renders a knowledge response with confidence score and related entities
 * @param {Object} knowledgeData - Knowledge response data
 * @param {string} knowledgeData.answer - The answer text
 * @param {number} knowledgeData.confidence - Confidence score (0-1)
 * @param {Array} knowledgeData.sources - Array of source references
 * @param {Object} knowledgeData.relatedEntities - Related entity data
 * @returns {HTMLElement} DOM element for knowledge response
 */
function renderKnowledgeResponse(knowledgeData) {
  if (!knowledgeData || typeof knowledgeData !== "object") {
    throw new Error("Knowledge data must be an object");
  }

  const { answer, confidence, sources, relatedEntities } = knowledgeData;

  const wrapper = document.createElement("div");
  wrapper.className = "knowledge-response-wrapper";

  const confidenceDiv = document.createElement("div");
  confidenceDiv.className = "knowledge-confidence";
  const confidencePercent = Math.round((confidence || 0) * 100);
  confidenceDiv.textContent = `Confidence: ${confidencePercent}%`;
  wrapper.appendChild(confidenceDiv);

  const answerDiv = document.createElement("div");
  answerDiv.className = "knowledge-answer";
  answerDiv.innerHTML = parseBasicMarkdown(answer || "");
  wrapper.appendChild(answerDiv);

  if (sources && sources.length > 0) {
    const sourcesDiv = document.createElement("div");
    sourcesDiv.className = "knowledge-sources";
    sourcesDiv.innerHTML = "<strong>Sources:</strong>";
    const sourcesList = document.createElement("ul");
    sources.forEach((source) => {
      const li = document.createElement("li");
      li.textContent = source;
      sourcesList.appendChild(li);
    });
    sourcesDiv.appendChild(sourcesList);
    wrapper.appendChild(sourcesDiv);
  }

  if (relatedEntities && Object.keys(relatedEntities).length > 0) {
    const entitiesDiv = document.createElement("div");
    entitiesDiv.className = "knowledge-entities";
    entitiesDiv.innerHTML = "<strong>Related Entities:</strong>";

    Object.entries(relatedEntities).forEach(([type, entities]) => {
      if (entities && entities.length > 0) {
        const typeDiv = document.createElement("div");
        typeDiv.className = "entity-type";
        typeDiv.innerHTML = `<span class="entity-label">${type}:</span>`;
        const entityList = document.createElement("div");
        entityList.className = "entity-list";
        entities.forEach((entity) => {
          const entitySpan = document.createElement("span");
          entitySpan.className = "entity-item";
          entitySpan.textContent =
            entity.name || entity.id || JSON.stringify(entity);
          entityList.appendChild(entitySpan);
        });
        typeDiv.appendChild(entityList);
        entitiesDiv.appendChild(typeDiv);
      }
    });

    wrapper.appendChild(entitiesDiv);
  }

  return wrapper;
}

/**
 * Renders the message list container with history display
 * @param {HTMLElement} container - Container element to render the message list in
 * @param {ChatStateManager} chatStateManager - Chat state manager instance
 * @returns {Object} Component control object with update methods
 */
function messageList(container, chatStateManager) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("Container must be a valid HTMLElement");
  }

  if (!chatStateManager || !(chatStateManager instanceof ChatStateManager)) {
    throw new Error("chatStateManager must be a ChatStateManager instance");
  }

  const listContainer = document.createElement("div");
  listContainer.className = "chat-message-list";
  container.appendChild(listContainer);

  let isLoading = false;

  function renderMessages() {
    try {
      listContainer.innerHTML = "";
      const history = chatStateManager.getHistory();

      if (history.length === 0 && !isLoading) {
        renderEmptyState();
        return;
      }

      history.forEach((msg) => {
        const messageElement = chatMessage(msg);
        listContainer.appendChild(messageElement);

        if (msg.role === "assistant" && msg.knowledgeData) {
          const knowledgeElement = renderKnowledgeResponse(msg.knowledgeData);
          listContainer.appendChild(knowledgeElement);
        }
      });

      if (isLoading) {
        renderLoadingIndicator();
      }

      scrollToBottom();
    } catch (error) {
      console.error("Failed to render messages:", error);
      listContainer.innerHTML = `
        <div class="chat-message-empty">
          <p>Error loading messages. Please refresh the page.</p>
        </div>
      `;
    }
  }

  function renderEmptyState() {
    const emptyState = document.createElement("div");
    emptyState.className = "chat-message-empty";
    emptyState.innerHTML = `
      <p>No messages yet. Start a conversation!</p>
    `;
    listContainer.appendChild(emptyState);
  }

  function renderLoadingIndicator() {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "chat-message-loading";
    loadingIndicator.innerHTML = `
      <div class="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    listContainer.appendChild(loadingIndicator);
  }

  function scrollToBottom() {
    listContainer.scrollTop = listContainer.scrollHeight;
  }

  function setLoading(loading) {
    isLoading = loading;
    renderMessages();
  }

  function refresh() {
    renderMessages();
  }

  renderMessages();

  return {
    setLoading,
    refresh,
    scrollToBottom,
  };
}

export { messageList };
