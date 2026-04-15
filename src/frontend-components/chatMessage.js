/**
 * @fileoverview Individual chat message component with styling and markdown support
 * @module frontend-components/chatMessage
 */

/**
 * Renders a single chat message with appropriate styling based on role
 * @param {Object} message - Message object from ChatStateManager
 * @param {string} message.id - Unique message identifier
 * @param {'user'|'assistant'} message.role - Message role (user or assistant)
 * @param {string} message.content - Message content
 * @param {number} message.timestamp - Unix timestamp
 * @returns {HTMLElement} DOM element for the message
 */
function chatMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }

  const { id, role, content, timestamp } = message;

  if (!id || typeof id !== 'string') {
    throw new Error('Message must have a valid id');
  }

  if (role !== 'user' && role !== 'assistant') {
    throw new Error('Message role must be "user" or "assistant"');
  }

  if (!content || typeof content !== 'string') {
    throw new Error('Message must have valid content');
  }

  if (!timestamp || typeof timestamp !== 'number') {
    throw new Error('Message must have a valid timestamp');
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message chat-message-${role}`;
  messageDiv.dataset.messageId = id;

  const messageContent = document.createElement('div');
  messageContent.className = 'chat-message-content';

  if (role === 'assistant') {
    messageContent.innerHTML = parseBasicMarkdown(content);
  } else {
    messageContent.textContent = content;
  }

  const messageMeta = document.createElement('div');
  messageMeta.className = 'chat-message-meta';

  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'chat-message-timestamp';
  timestampSpan.textContent = formatTimestamp(timestamp);

  const roleLabel = document.createElement('span');
  roleLabel.className = 'chat-message-role';
  roleLabel.textContent = role === 'user' ? 'You' : 'AI';

  messageMeta.appendChild(roleLabel);
  messageMeta.appendChild(timestampSpan);

  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(messageMeta);

  return messageDiv;
}

/**
 * Parses basic markdown syntax for AI responses
 * Supports: **bold**, *italic*, `code`, and line breaks
 * @param {string} text - Text to parse
 * @returns {string} HTML string with basic formatting
 */
function parseBasicMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Formats a Unix timestamp into a readable time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return '';
  }

  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${ampm}`;
}

export { chatMessage };
