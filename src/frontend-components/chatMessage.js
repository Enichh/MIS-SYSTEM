/**
 * @fileoverview Individual chat message component with styling and markdown support
 * @module frontend-components/chatMessage
 */

/**
 * Formats entity data for display (ProjectDTO, EmployeeDTO, TaskDTO)
 * @param {Object} entity - Entity data object
 * @param {string} entityType - Type of entity (project, employee, task)
 * @returns {string} HTML string with formatted entity data
 */
function formatEntityData(entity, entityType) {
  if (!entity || typeof entity !== "object") {
    return "";
  }

  let html = `<div class="entity-card entity-${entityType}">`;

  if (entityType === "project") {
    html += `<div class="entity-header"><strong>Project:</strong> ${entity.name || "Unknown"}</div>`;
    if (entity.description)
      html += `<div class="entity-desc">${entity.description}</div>`;
    if (entity.status)
      html += `<div class="entity-status">Status: ${entity.status}</div>`;
    if (entity.startDate)
      html += `<div class="entity-date">Start: ${entity.startDate}</div>`;
    if (entity.endDate)
      html += `<div class="entity-date">End: ${entity.endDate}</div>`;
  } else if (entityType === "employee") {
    html += `<div class="entity-header"><strong>Employee:</strong> ${entity.name || "Unknown"}</div>`;
    if (entity.email) html += `<div class="entity-email">${entity.email}</div>`;
    if (entity.role)
      html += `<div class="entity-role">Role: ${entity.role}</div>`;
    if (entity.department)
      html += `<div class="entity-dept">Dept: ${entity.department}</div>`;
    if (entity.projects && entity.projects.length > 0) {
      html += `<div class="entity-projects">Projects: ${entity.projects.join(", ")}</div>`;
    }
  } else if (entityType === "task") {
    html += `<div class="entity-header"><strong>Task:</strong> ${entity.title || "Unknown"}</div>`;
    if (entity.description)
      html += `<div class="entity-desc">${entity.description}</div>`;
    if (entity.status)
      html += `<div class="entity-status">Status: ${entity.status}</div>`;
    if (entity.projectId)
      html += `<div class="entity-project">Project ID: ${entity.projectId}</div>`;
    if (entity.assignedTo)
      html += `<div class="entity-assignee">Assigned to: ${entity.assignedTo}</div>`;
    if (entity.dueDate)
      html += `<div class="entity-date">Due: ${entity.dueDate}</div>`;
  }

  html += "</div>";
  return html;
}

/**
 * Renders a single chat message with appropriate styling based on role
 * @param {Object} message - Message object from ChatStateManager
 * @param {string} message.id - Unique message identifier
 * @param {'user'|'assistant'} message.role - Message role (user or assistant)
 * @param {string} message.content - Message content
 * @param {number} message.timestamp - Unix timestamp
 * @param {Object} [message.knowledgeData] - Optional knowledge response data
 * @returns {HTMLElement} DOM element for the message
 */
function chatMessage(message) {
  if (!message || typeof message !== "object") {
    throw new Error("Message must be an object");
  }

  const { id, role, content, timestamp, knowledgeData } = message;

  if (!id || typeof id !== "string") {
    throw new Error("Message must have a valid id");
  }

  if (role !== "user" && role !== "assistant") {
    throw new Error('Message role must be "user" or "assistant"');
  }

  if (!content || typeof content !== "string") {
    throw new Error("Message must have valid content");
  }

  if (!timestamp || typeof timestamp !== "number") {
    throw new Error("Message must have a valid timestamp");
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message chat-message-${role}`;
  messageDiv.dataset.messageId = id;

  const messageContent = document.createElement("div");
  messageContent.className = "chat-message-content";

  if (role === "assistant") {
    messageContent.innerHTML = parseBasicMarkdown(content);

    if (knowledgeData) {
      const knowledgeDiv = document.createElement("div");
      knowledgeDiv.className = "message-knowledge-data";

      if (knowledgeData.relatedEntities) {
        const entitiesSection = document.createElement("div");
        entitiesSection.className = "knowledge-entities-section";

        Object.entries(knowledgeData.relatedEntities).forEach(
          ([entityType, entities]) => {
            if (entities && entities.length > 0) {
              entities.forEach((entity) => {
                const entityHtml = formatEntityData(entity, entityType);
                entitiesSection.innerHTML += entityHtml;
              });
            }
          },
        );

        if (entitiesSection.innerHTML) {
          knowledgeDiv.appendChild(entitiesSection);
        }
      }

      if (knowledgeData.sources && knowledgeData.sources.length > 0) {
        const sourcesSection = document.createElement("div");
        sourcesSection.className = "knowledge-sources-section";
        sourcesSection.innerHTML = "<strong>Sources:</strong><ul>";
        knowledgeData.sources.forEach((source) => {
          sourcesSection.innerHTML += `<li>${source}</li>`;
        });
        sourcesSection.innerHTML += "</ul>";
        knowledgeDiv.appendChild(sourcesSection);
      }

      if (knowledgeData.confidence !== undefined) {
        const confidenceSection = document.createElement("div");
        confidenceSection.className = "knowledge-confidence-section";
        const confidencePercent = Math.round(knowledgeData.confidence * 100);
        confidenceSection.textContent = `Confidence: ${confidencePercent}%`;
        knowledgeDiv.appendChild(confidenceSection);
      }

      if (knowledgeDiv.children.length > 0) {
        messageContent.appendChild(knowledgeDiv);
      }
    }
  } else {
    messageContent.textContent = content;
  }

  const messageMeta = document.createElement("div");
  messageMeta.className = "chat-message-meta";

  const timestampSpan = document.createElement("span");
  timestampSpan.className = "chat-message-timestamp";
  timestampSpan.textContent = formatTimestamp(timestamp);

  const roleLabel = document.createElement("span");
  roleLabel.className = "chat-message-role";
  roleLabel.textContent = role === "user" ? "User" : "AI";

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
  if (!text || typeof text !== "string") {
    return "";
  }

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.*?)`/g, "<code>$1</code>");
  html = html.replace(/\n/g, "<br>");

  return html;
}

/**
 * Formats a Unix timestamp into a readable time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string (e.g., "2:30 PM")
 */
function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== "number") {
    return "";
  }

  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${ampm}`;
}

export { chatMessage };
