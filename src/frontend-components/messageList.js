/**
 * @fileoverview Message history component with auto-scroll and state handling
 * @module frontend-components/messageList
 */

import { ChatStateManager } from '../shared/chatStateManager.js';
import { chatMessage } from './chatMessage.js';

/**
 * Renders the message list container with history display
 * @param {HTMLElement} container - Container element to render the message list in
 * @param {ChatStateManager} chatStateManager - Chat state manager instance
 * @returns {Object} Component control object with update methods
 */
function messageList(container, chatStateManager) {
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('Container must be a valid HTMLElement');
  }

  if (!chatStateManager || !(chatStateManager instanceof ChatStateManager)) {
    throw new Error('chatStateManager must be a ChatStateManager instance');
  }

  const listContainer = document.createElement('div');
  listContainer.className = 'chat-message-list';
  container.appendChild(listContainer);

  let isLoading = false;

  function renderMessages() {
    listContainer.innerHTML = '';
    const history = chatStateManager.getHistory();

    if (history.length === 0 && !isLoading) {
      renderEmptyState();
      return;
    }

    history.forEach(msg => {
      const messageElement = chatMessage(msg);
      listContainer.appendChild(messageElement);
    });

    if (isLoading) {
      renderLoadingIndicator();
    }

    scrollToBottom();
  }

  function renderEmptyState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'chat-message-empty';
    emptyState.innerHTML = `
      <p>No messages yet. Start a conversation!</p>
    `;
    listContainer.appendChild(emptyState);
  }

  function renderLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'chat-message-loading';
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
    scrollToBottom
  };
}

export { messageList };
