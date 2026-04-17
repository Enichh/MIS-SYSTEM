'use client';

import { useState, useEffect, useRef } from 'react';
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
  const onSearchRef = useRef(onSearch);
  const entityTypeRef = useRef(entityType);

  // Keep refs in sync with latest props
  useEffect(() => {
    onSearchRef.current = onSearch;
    entityTypeRef.current = entityType;
  }, [onSearch, entityType]);

  // Stable debounced search handler that doesn't get recreated
  const debouncedSearchRef = useRef(
    debounceSearch((query: string) => {
      if (query.length >= MIN_SEARCH_LENGTH || query.length === 0) {
        onSearchRef.current({ query, entityType: entityTypeRef.current });
      }
    }, SEARCH_DEBOUNCE_MS)
  );

  useEffect(() => {
    debouncedSearchRef.current(inputValue);
  }, [inputValue]);

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
