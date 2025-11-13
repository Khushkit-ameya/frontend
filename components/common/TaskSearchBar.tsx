'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Checkbox from '../ui buttons/Checkbox';

/**
 * TaskSearchBar Component for Task & Subtask Filtering
 * 
 * This component searches across both tasks and subtasks with the following fields:
 * - taskName, subtaskName
 * - description (for both tasks and subtasks)
 * - taskType, subtaskType
 * - tags (for both tasks and subtasks)
 * 
 * Search uses the "contains" (cn) operator for all searches.
 * The API sends search parameters in the format:
 * ?fieldName=cn:value
 */

// Define searchable columns for tasks and subtasks
const SEARCHABLE_COLUMNS = [
  { key: 'taskName', label: 'Task Name' },
  { key: 'subtaskName', label: 'Subtask Name' },
  { key: 'description', label: 'Description (Task & Subtask)' },
  { key: 'taskType', label: 'Task Type' },
  { key: 'subtaskType', label: 'Subtask Type' },
  { key: 'tags', label: 'Tags (Task & Subtask)' },
];

// Available search operators
const SEARCH_OPERATORS = [
  { key: 'cn', label: 'Contains', description: 'Text contains value (case insensitive)' },
  { key: 'eq', label: 'Equals', description: 'Exact match' },
  { key: 'sw', label: 'Starts with', description: 'Text starts with value' },
  { key: 'ew', label: 'Ends with', description: 'Text ends with value' },
  { key: 'ne', label: 'Not equals', description: 'Does not match' },
  { key: 'nc', label: 'Not contains', description: 'Text does not contain value' },
];

interface TaskSearchBarProps {
  onSearch?: (searchTerm: string, selectedColumns: string[], searchParams?: Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  defaultSelectedColumns?: string[];
  defaultOperator?: string;
  showOperatorSelector?: boolean;
}

export default function TaskSearchBar({
  onSearch,
  placeholder = "Search tasks and subtasks...",
  className = "",
  defaultSelectedColumns = ['taskName', 'subtaskName', 'description', 'tags'],
  defaultOperator = 'cn',
  showOperatorSelector = false // Always false - operator selector is hidden
}: TaskSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultSelectedColumns);
  const [selectedOperator] = useState('cn'); // Always 'cn' (contains) - fixed, not changeable
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Build query parameters according to API format (operator:value)
  const buildSearchParams = (term: string, columns: string[], operator: string = selectedOperator) => {
    if (!term.trim() || columns.length === 0) {
      return {};
    }

    const params: Record<string, string> = {};
    const trimmedTerm = term.trim();

    // For each selected column, add a search parameter with the selected operator
    columns.forEach(column => {
      params[column] = `${operator}:${trimmedTerm}`;
    });

    return params;
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Handle Enter key press to trigger search
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      triggerSearch();
    }
  };

  // Trigger search function
  const triggerSearch = () => {
    if (onSearch) {
      const searchParams = buildSearchParams(searchTerm, selectedColumns, selectedOperator);
      onSearch(searchTerm, selectedColumns, searchParams);
    }
  };

  // Handle column selection toggle
  const handleColumnToggle = (columnKey: string) => {
    const newSelectedColumns = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(col => col !== columnKey)
      : [...selectedColumns, columnKey];

    setSelectedColumns(newSelectedColumns);

    // Trigger search with new columns if there's a search term
    if (onSearch && searchTerm) {
      const searchParams = buildSearchParams(searchTerm, newSelectedColumns, selectedOperator);
      onSearch(searchTerm, newSelectedColumns, searchParams);
    }
  };

  // Handle "All columns" toggle
  const handleAllColumnsToggle = () => {
    const allColumnKeys = SEARCHABLE_COLUMNS.map(col => col.key);
    const newSelectedColumns = selectedColumns.length === allColumnKeys.length
      ? []
      : allColumnKeys;

    setSelectedColumns(newSelectedColumns);

    // Trigger search with new columns if there's a search term
    if (onSearch && searchTerm) {
      const searchParams = buildSearchParams(searchTerm, newSelectedColumns, selectedOperator);
      onSearch(searchTerm, newSelectedColumns, searchParams);
    }
  };

  // Position popover
  const updatePopoverPosition = () => {
    if (!searchBarRef.current) return;

    const rect = searchBarRef.current.getBoundingClientRect();
    setPopoverPosition({
      left: Math.round(rect.left),
      top: Math.round(rect.bottom + 4)
    });
  };

  // Handle popover open/close
  const togglePopover = () => {
    if (!isPopoverOpen) {
      updatePopoverPosition();
    }
    setIsPopoverOpen(!isPopoverOpen);
  };

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !searchBarRef.current?.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePopoverPosition, true);
      window.addEventListener('resize', updatePopoverPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [isPopoverOpen]);

  const allColumnsSelected = selectedColumns.length === SEARCHABLE_COLUMNS.length;
  const someColumnsSelected = selectedColumns.length > 0 && selectedColumns.length < SEARCHABLE_COLUMNS.length;

  return (
    <div className={`relative mr-1 ${className}`} ref={searchBarRef}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        {/* Search Icon - Clickable to trigger search */}
        <button
          type="button"
          onClick={triggerSearch}
          className="absolute inset-y-0 left-0 pl-3 flex items-center hover:opacity-70 transition-opacity"
          title="Search (or press Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-[18px] h-[18px] text-gray-400"
            fill="none"
            viewBox="0 0 25 25"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z"
            />
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-16 w-[200px] py-1 border bg-white border-gray-400 rounded outline-none text-sm"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              if (onSearch) {
                onSearch('', selectedColumns, {});
              }
            }}
            className="absolute right-8 top-1 p-1 hover:bg-gray-100 rounded transition-colors"
            title="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}


        {/* Column Selection Button */}
        <button
          type="button"
          onClick={togglePopover}
          className="absolute right-1 top-1 p-1 hover:bg-gray-100 rounded transition-colors"
          title="Choose columns to search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
            />
          </svg>
        </button>
      </div>

      {/* Column Selection Popover */}
      {isPopoverOpen && popoverPosition && createPortal(
        <div
          ref={popoverRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-2 min-w-[280px]"
          style={{
            left: popoverPosition.left,
            top: popoverPosition.top,
            maxHeight: 'calc(100vh - 16px)',
            overflow: 'auto'
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Select Search Fields</h3>
          </div>

          {/* Columns Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <h4 className="text-xs font-medium text-gray-600">Search Columns</h4>
          </div>

          {/* All Columns Option */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleAllColumnsToggle}>
              <div className="relative">
                <Checkbox
                  checked={allColumnsSelected}
                  onChange={handleAllColumnsToggle}
                />
                {someColumnsSelected && !allColumnsSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                All columns {selectedColumns.length} selected
              </span>
            </div>
          </div>

          {/* Individual Column Options */}
          <div className="max-h-60 overflow-y-auto">
            {SEARCHABLE_COLUMNS.map((column) => (
              <div
                key={column.key}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleColumnToggle(column.key)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedColumns.includes(column.key)}
                    onChange={() => handleColumnToggle(column.key)}
                  />
                  <div className="flex items-center gap-2">
                    {/* Column Type Icon */}
                    <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-mono">
                      {column.key === 'taskName' ? 'T' :
                        column.key === 'subtaskName' ? 'S' :
                          column.key === 'description' ? 'D' :
                            column.key === 'taskType' ? 'TT' :
                              column.key === 'subtaskType' ? 'ST' :
                                'G'}
                    </div>
                    <span className="text-sm text-gray-700">{column.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with configuration summary */}
          <div className="px-3 py-2 border-t border-gray-100 text-xs">
            <div className="text-gray-500">
              {selectedColumns.length} of {SEARCHABLE_COLUMNS.length} columns selected
            </div>
            {selectedColumns.length > 0 && searchTerm && (
              <div className="text-blue-600 mt-1 max-h-12 overflow-y-auto">
                Searching: {selectedColumns.map(c => SEARCHABLE_COLUMNS.find(sc => sc.key === c)?.label).join(', ')}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
