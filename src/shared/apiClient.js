/**
 * @fileoverview API client for LONGCAT chat integration and employee data queries
 * @module shared/apiClient
 */

import { getAllEmployees } from './database.js';
import { Employee } from './models.js';

/**
 * LONGCAT API client for chat completions
 * @param {string} apiKey - LONGCAT API key for authentication
 * @param {string} message - User message to send to the API
 * @param {object} context - Additional context for the chat (employee data, etc.)
 * @returns {Promise<{response: string, usage: object}>} API response with message and usage data
 * @throws {Error} If API request fails or times out
 * @example
 * const result = await longcatApiClient('sk-xxx', 'Hello', { employeeName: 'John' });
 * console.log(result.response);
 */
async function longcatApiClient(apiKey, message, context = {}) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key must be a non-empty string');
  }

  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const systemMessage = 'You are a helpful assistant for a project management system.';
    const contextMessage = Object.keys(context).length > 0 
      ? `\n\nAdditional context:\n${JSON.stringify(context, null, 2)}`
      : '';

    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          { role: 'system', content: systemMessage + contextMessage },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Invalid API key provided');
      }
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Retry after ${errorData.retry_after || 60} seconds`);
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    return {
      response: responseText,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API request timed out after 30 seconds');
    }
    throw new Error(`longcatApiClient error: ${error.message}`);
  }
}

/**
 * Query employee database for chat context
 * @param {string} query - Search query string (matches name, email, or workType)
 * @returns {Promise<Employee[]>} Array of matching employees
 * @throws {Error} If database query fails
 * @example
 * const employees = await queryEmployeeData('John');
 * console.log(employees);
 */
async function queryEmployeeData(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  try {
    const allEmployees = await getAllEmployees();
    const lowerQuery = query.toLowerCase();

    const filtered = allEmployees.filter(employee => {
      return employee.name.toLowerCase().includes(lowerQuery) ||
             employee.email.toLowerCase().includes(lowerQuery) ||
             employee.workType.toLowerCase().includes(lowerQuery);
    });

    return filtered;
  } catch (error) {
    throw new Error(`queryEmployeeData error: ${error.message}`);
  }
}

export { longcatApiClient, queryEmployeeData };
