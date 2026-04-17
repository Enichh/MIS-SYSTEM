'use client';

import { useState, useDeferredValue, useEffect, useCallback } from 'react';
import type { SearchQuery } from '@/types';
import { debounceSearch } from '@/lib/utils/search';
import { SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH } from '@/lib/constants';
import './SearchBar.css';

interface SearchBarProps {
  entityType: 'employees' | 'projects' | 'tasks';
  onSearch: (query: SearchQuery) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function SearchBar({
  entityType,
  onSearch,
  placeholder = 'Search...',
  ariaLabel = 'Search input',
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const deferredQuery = useDeferredValue(inputValue);

  const debouncedSearchHandler = useCallback(
    debounceSearch((query: unknown) => {
      const queryString = query as string;
      if (queryString.length >= MIN_SEARCH_LENGTH || queryString.length === 0) {
        if (onSearch) {
          onSearch({ query: queryString, entityType });
        }
      }
    }, SEARCH_DEBOUNCE_MS),
    [entityType, onSearch, SEARCH_DEBOUNCE_MS, MIN_SEARCH_LENGTH]
  );

  useEffect(() => {
    debouncedSearchHandler(deferredQuery);
  }, [deferredQuery, debouncedSearchHandler]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-bar__input"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="searchbox"
        aria-controls="search-results"
        maxLength={255}
      />
      {inputValue.length > 0 && inputValue.length < MIN_SEARCH_LENGTH && (
        <span className="search-bar__hint" role="status">
          Type at least {MIN_SEARCH_LENGTH} characters to search
        </span>
      )}
    </div>
  );
}
