'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Checkbox from '../ui buttons/Checkbox';

/**
 * SearchBar Component for Activity Filtering
 * 
 * This component integrates with the getAllActivities API which uses prismaAdvancedFetch
 * for dynamic filtering. The API expects query parameters in the format:
 * 
 * Format: fieldName=operator:value
 * Example: ?title=cn:meeting&type=eq:call&status.statusName=eq:completed
 * 
 * Available operators:
 * - eq: equals
 * - ne: not equals  
 * - cn: contains (case insensitive) - Used by this component
 * - nc: not contains
 * - sw: starts with
 * - ew: ends with
 * - in: in array (comma-separated values)
 * - nin: not in array
 * - lt, lte, gt, gte: comparison operators
 * - bt: between (range)
 * 
 * This component uses "cn" (contains) operator for user-friendly text search.
 */

// Define available searchable columns based on the Activities API
// These match the field keys from the backend getAllActivities API
const SEARCHABLE_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type (meeting, call, notes, toDo, email)' },
  { key: 'status.statusName', label: 'Status' },
  { key: 'assignedToId', label: 'Assigned To (User ID)' },
  { key: 'createdById', label: 'Created By (User ID)' },
  { key: 'projectId', label: 'Project (ID)' },
  { key: 'taskId', label: 'Task (ID)' },
  { key: 'subTaskId', label: 'Sub-Task (ID)' },
  { key: 'scheduleTimeFrom', label: 'Start Time' },
  { key: 'scheduleTimeTo', label: 'End Time' },
];

// Available search operators for advanced users
const SEARCH_OPERATORS = [
  { key: 'cn', label: 'Contains', description: 'Text contains value (case insensitive)' },
  { key: 'eq', label: 'Equals', description: 'Exact match' },
  { key: 'sw', label: 'Starts with', description: 'Text starts with value' },
  { key: 'ew', label: 'Ends with', description: 'Text ends with value' },
  { key: 'ne', label: 'Not equals', description: 'Does not match' },
  { key: 'nc', label: 'Not contains', description: 'Text does not contain value' },
];

interface ActivitySearchBarProps {
  onSearch?: (searchTerm: string, selectedColumns: string[], searchParams?: Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  defaultSelectedColumns?: string[];
  defaultOperator?: string; // Default search operator
  showOperatorSelector?: boolean; // Show operator selection UI
}

export default function ActivitySearchBar({ 
  onSearch, 
  placeholder = "Search activities",
  className = "",
  defaultSelectedColumns = ['title', 'type'],
  defaultOperator = 'cn',
  showOperatorSelector = false
}: ActivitySearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultSelectedColumns);
  const [selectedOperator, setSelectedOperator] = useState(defaultOperator);
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
    
    // Build and trigger search callback with proper API format
    if (onSearch) {
      const searchParams = buildSearchParams(value, selectedColumns, selectedOperator);
      onSearch(value, selectedColumns, searchParams);
    }
  };

  // Handle column selection toggle
  const handleColumnToggle = (columnKey: string) => {
    const newSelectedColumns = selectedColumns.includes(columnKey)
      ? selectedColumns.filter(col => col !== columnKey)
      : [...selectedColumns, columnKey];
    
    setSelectedColumns(newSelectedColumns);
    
    // Trigger search with new columns if there's a search term
    if (onSearch) {
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
    if (onSearch) {
      const searchParams = buildSearchParams(searchTerm, newSelectedColumns, selectedOperator);
      onSearch(searchTerm, newSelectedColumns, searchParams);
    }
  };

  // Handle operator selection change
  const handleOperatorChange = (operatorKey: string) => {
    setSelectedOperator(operatorKey);
    
    // Trigger search with new operator if there's a search term
    if (onSearch && searchTerm) {
      const searchParams = buildSearchParams(searchTerm, selectedColumns, operatorKey);
      onSearch(searchTerm, selectedColumns, searchParams);
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

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('', selectedColumns, {});
    }
  };

  return (
    <>
      <div ref={searchBarRef} className={`relative ${className}`}>
        <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Search Input */}
          <div className="flex-1 flex items-center">
            <svg
              className="w-4 h-4 text-gray-400 ml-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="p-1 mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Options Button */}
          <button
            onClick={togglePopover}
            className={`px-3 py-2 text-sm font-medium border-l border-gray-200 rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
              isPopoverOpen || selectedColumns.length > 0
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Configure search options"
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              {selectedColumns.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {selectedColumns.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Search Options Popover */}
      {isPopoverOpen && popoverPosition && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            left: `${popoverPosition.left}px`,
            top: `${popoverPosition.top}px`,
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Search Options</h3>
              <button
                onClick={togglePopover}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Operator Selection (if enabled) */}
            {showOperatorSelector && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Search Type
                </label>
                <select
                  value={selectedOperator}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SEARCH_OPERATORS.map(op => (
                    <option key={op.key} value={op.key} title={op.description}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Column Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">
                  Search In Columns
                </label>
                <button
                  onClick={handleAllColumnsToggle}
                  className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  {allColumnsSelected ? 'Clear All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {SEARCHABLE_COLUMNS.map(column => (
                  <div key={column.key} className="flex items-center">
                    <Checkbox
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      className="mr-2"
                    />
                    <label 
                      className="text-sm text-gray-700 cursor-pointer select-none flex-1"
                      onClick={() => handleColumnToggle(column.key)}
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>

              {selectedColumns.length === 0 && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Select at least one column to search in
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}