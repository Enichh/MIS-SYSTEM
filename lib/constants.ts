export const API_BASE_URL = '/api';

export const KNOWLEDGE_ENDPOINTS = {
  query: '/api/knowledge/query',
} as const;

export const CHAT_STORAGE_KEY = 'mis_chat_history';

export const THEME_STORAGE_KEY = 'enosoft_theme_preference';

export const PROJECT_STATUS = ['active', 'completed', 'on_hold'] as const;
export const PROJECT_PRIORITY = ['high', 'medium', 'low'] as const;

export const TASK_STATUS = ['completed', 'in_progress', 'pending'] as const;
export const TASK_PRIORITY = ['high', 'medium', 'low'] as const;

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_SEARCH_LENGTH = 2;
