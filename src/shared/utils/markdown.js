/**
 * @fileoverview Markdown parsing utility with HTML escaping
 * @module shared/utils/markdown
 */

/**
 * Parses basic markdown syntax for AI responses
 * Supports: **bold**, *italic*, `code`, and line breaks
 * @param {string} text - Text to parse
 * @returns {string} HTML string with basic formatting
 */
export function parseBasicMarkdown(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  html = html.replace(/\n/g, '<br>');

  return html;
}
