'use client';

import type { Employee, Project, Task } from '@/types';
import './SearchResults.css';

interface SearchResultsProps {
  results: Employee[] | Project[] | Task[];
  entityType: 'employees' | 'projects' | 'tasks';
  isLoading?: boolean;
  query: string;
  onSelectItem?: (item: Employee | Project | Task) => void;
}

export function SearchResults({
  results,
  entityType,
  isLoading = false,
  query,
  onSelectItem,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="search-results" role="status" aria-live="polite">
        <div className="search-results__loading">Loading...</div>
      </div>
    );
  }

  if (query.length === 0) {
    return null;
  }

  if (results.length === 0) {
    return (
      <div className="search-results" role="status" aria-live="polite">
        <div className="search-results__empty">
          No {entityType} found matching &ldquo;{query}&rdquo;
        </div>
      </div>
    );
  }

  const renderItem = (item: Employee | Project | Task, index: number) => {
    const key = item.id;
    let name: string;
    let subtitle: string | undefined;

    if (entityType === 'employees') {
      const employee = item as Employee;
      name = employee.name;
      subtitle = employee.email;
    } else if (entityType === 'projects') {
      const project = item as Project;
      name = project.name;
      subtitle = project.description;
    } else {
      const task = item as Task;
      name = task.title;
      subtitle = task.description;
    }

    return (
      <div
        key={key}
        className="search-results__item"
        onClick={() => onSelectItem?.(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelectItem?.(item);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Select ${name}`}
      >
        <div className="search-results__item-name">{name}</div>
        {subtitle && (
          <div className="search-results__item-subtitle">{subtitle}</div>
        )}
      </div>
    );
  };

  return (
    <div className="search-results" id="search-results" role="listbox" aria-label={`${entityType} search results`}>
      <div className="search-results__header">
        {results.length} {entityType} found
      </div>
      <div className="search-results__list">
        {results.map((item, index) => renderItem(item, index))}
      </div>
    </div>
  );
}
