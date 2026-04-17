import type { SearchFilters } from '@/types';

/**
 * Internal helper: Normalizes search query by trimming and lowercasing
 */
function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Internal helper: Checks if a term matches a search term case-insensitively
 */
function matchesSearchTerm(term: string, searchTerm: string): boolean {
  return normalizeSearchQuery(term).includes(normalizeSearchQuery(searchTerm));
}

/**
 * Debounce function with 300ms delay
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds (default 300)
 * @returns Debounced function
 */
export function debounceSearch<T extends (...args: any[]) => unknown>(
  func: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Case-insensitive string matching function
 * @param term - Term to search in
 * @param searchTerm - Search term to match
 * @returns True if term contains search term (case-insensitive)
 */
export function filterByName(term: string, searchTerm: string): boolean {
  return matchesSearchTerm(term, searchTerm);
}

/**
 * Function to construct filter objects from search query
 * @param query - Search query string
 * @param entityType - Entity type being searched
 * @returns SearchFilters object
 */
export function buildSearchFilters(
  query: string,
  entityType: 'employees' | 'projects' | 'tasks'
): SearchFilters {
  const filters: SearchFilters = {};

  if (query && query.trim().length > 0) {
    filters.name = query.trim();
  }

  return filters;
}
