/**
 * @fileoverview API client for LONGCAT chat integration and Netlify Functions
 * @module shared/apiClient
 */

import { getAllEmployees } from "./database.js";
import { KNOWLEDGE_ENDPOINTS } from "../constants.js";

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
  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("API key must be a non-empty string");
  }

  if (!message || typeof message !== "string") {
    throw new Error("Message must be a non-empty string");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const systemMessage =
      "You are a helpful assistant for a project management system.";
    const contextMessage =
      Object.keys(context).length > 0
        ? `\n\nAdditional context:\n${JSON.stringify(context, null, 2)}`
        : "";

    const response = await fetch(
      "https://api.longcat.chat/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "LongCat-Flash-Chat",
          messages: [
            { role: "system", content: systemMessage + contextMessage },
            { role: "user", content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error("Invalid API key provided");
      }
      if (response.status === 429) {
        throw new Error(
          `Rate limit exceeded. Retry after ${errorData.retry_after || 60} seconds`,
        );
      }
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "";

    return {
      response: responseText,
      usage: data.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("API request timed out after 30 seconds");
    }
    throw new Error(`longcatApiClient error: ${error.message}`);
  }
}

/**
 * Sanitize query string for safe API transmission
 * @param {string} query - Raw query string
 * @returns {string} Sanitized query
 */
function sanitizeQuery(query) {
  if (!query || typeof query !== "string") return "";
  return query.trim().slice(0, 1000);
}

/**
 * Format knowledge response from Netlify Function
 * @param {object} data - Raw response data
 * @returns {object} Formatted KnowledgeResponse
 */
function formatKnowledgeResponse(data) {
  return {
    answer: data.answer || "",
    sources: data.sources || [],
    confidence: data.confidence || 0,
    relatedEntities: data.relatedEntities || {},
  };
}

/**
 * Query knowledge base via Netlify Function
 * @param {KnowledgeQuery} knowledgeQuery - Query object with query string and optional context
 * @returns {Promise<KnowledgeResponse>} Knowledge response with answer and metadata
 * @throws {Error} If API request fails
 * @example
 * const response = await queryKnowledge({
 *   query: 'What projects is John working on?',
 *   context: { employeeId: 'emp-123' }
 * });
 */
async function queryKnowledge(knowledgeQuery) {
  if (!knowledgeQuery || typeof knowledgeQuery !== "object") {
    throw new Error("KnowledgeQuery must be an object");
  }

  if (!knowledgeQuery.query || typeof knowledgeQuery.query !== "string") {
    throw new Error("KnowledgeQuery.query must be a non-empty string");
  }

  const sanitizedQuery = sanitizeQuery(knowledgeQuery.query);
  if (!sanitizedQuery) {
    throw new Error("Query cannot be empty after sanitization");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    console.log(
      "[DEBUG] queryKnowledge calling Netlify function:",
      KNOWLEDGE_ENDPOINTS.QUERY,
    );
    console.log(
      "[DEBUG] Request body:",
      JSON.stringify({
        query: sanitizedQuery,
        context: knowledgeQuery.context || {},
      }),
    );

    const response = await fetch(KNOWLEDGE_ENDPOINTS.QUERY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: sanitizedQuery,
        context: knowledgeQuery.context || {},
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(
      "[DEBUG] Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("[DEBUG] Error response:", JSON.stringify(errorData));
      throw new Error(
        `Knowledge query failed: ${response.status} ${response.statusText} - ${errorData.message || "Unknown error"}`,
      );
    }

    const data = await response.json();
    return formatKnowledgeResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Knowledge query timed out after 30 seconds");
    }
    throw new Error(`queryKnowledge error: ${error.message}`);
  }
}

/**
 * Initialize API client with configuration
 * @param {object} config - Configuration object
 * @param {string} [config.apiKey] - API key for authentication (if needed)
 * @param {number} [config.timeout=30000] - Request timeout in milliseconds
 * @returns {object} Initialized client instance
 * @example
 * const client = initializeApiClient({ apiKey: 'sk-xxx', timeout: 60000 });
 */
function initializeApiClient(config = {}) {
  const { apiKey, timeout = 30000 } = config;

  return {
    queryKnowledge,
    longcatApiClient: apiKey
      ? (message, context) => longcatApiClient(apiKey, message, context)
      : null,
    queryEmployeeData,
    config: {
      timeout,
      hasApiKey: !!apiKey,
    },
  };
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
  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  try {
    const allEmployees = await getAllEmployees();
    const lowerQuery = query.toLowerCase();

    const filtered = allEmployees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(lowerQuery) ||
        employee.email.toLowerCase().includes(lowerQuery) ||
        employee.workType.toLowerCase().includes(lowerQuery)
      );
    });

    return filtered;
  } catch (error) {
    throw new Error(`queryEmployeeData error: ${error.message}`);
  }
}

export {
  longcatApiClient,
  queryEmployeeData,
  queryKnowledge,
  initializeApiClient,
};
