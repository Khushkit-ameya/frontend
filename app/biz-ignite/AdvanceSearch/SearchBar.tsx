'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Checkbox from '@/components/ui buttons/Checkbox';
import { usePathname } from 'next/navigation';

/**
 * SearchBar Component for Filtering
 * 
 * This component integrates with the getAllProject API which uses prismaAdvancedFetch
 * for dynamic filtering. The API expects query parameters in the format:
 * 
 * Format: fieldName=operator:value
 * Example: ?name=cn:project&status=eq:active&priority=in:high,medium
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

// Define available searchable columns based on the API projectFields
// These match the field keys from the backend getAllProject API
const Holiday_Column = [
  { key: 'name', label: 'Holiday Name' },
  { key: 'description', label: 'Description' },
  { key: 'fromDate', label: 'From Date' },
  { key: 'toDate', label: 'To Date' },
  { key: 'holidayType', label: 'Holiday Type' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endTime', label: 'End Time' },
];
const leaveRequest_Column = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'from', label: 'From Date' },
  { key: 'to', label: 'To Date' },
  { key: 'leaveType', label: 'Leave Type' },
  { key: 'status', label: 'Status' },
   { key: 'reason', label: 'Reason' },
  { key: 'noOfDays', label: 'No of Days' },
   { key: 'comments', label: 'Comments' },
  { key: 'approvedBy', label: 'Approved by' },
];
const leaveAppiled_Column = [
   { key: 'leaveType', label: 'Leave Type' },
  { key: 'from', label: 'From Date' },
  { key: 'to', label: 'To Date' },
  { key: 'status', label: 'Status' },
   { key: 'reason', label: 'Reason' },
  { key: 'noOfDays', label: 'No of Days' },
   { key: 'comments', label: 'Comments' },
  { key: 'approvedBy', label: 'Approved by' },
];
const LEAVE_TYPE_COLUMN=[
  {key:'name', label:'Leave Type'},
  {key:'allocatedDays', label:'Allocated Day'},
  {key:'year', label:'Year'}
]
const LEAVE_BALANCE_COLUMN=[
  {key:'name', label:'Leave Type'},
  {key:'available', label:'Remaining Day'},
  {key:'booked', label:'Used Days'},
  {key:'year', label:'Year'}
]
 const LEAVE_RECORD_FIELDS=[
  {key:'name', label:'Name'},
  {key:'remainingDays', label:'Remaining Day'},
  {key:'usedDays', label:'Used Days'},
 ]
const SHIFT_FIELDS=[
  {key:'firstName', label:'User First Name'},
  {key:'lastName', label:'User Last Name'},
  {key:'email', label:'User Email'},
  {key:'role', label:'User Role'},
]
const ATTENDANCE_ADMIN_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'date', label: 'Date' },
  // { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'shift', label: 'Shift' },
  { key: 'status', label: 'Status' },
  { key: 'punchIn', label: 'Punch-In' },
  { key: 'punchOut', label: 'Punch-Out' },
  { key: 'inLocation', label: 'In Location' },
  { key: 'outLocation', label: 'Out Location' },
  { key: 'workedHours', label: 'Worked Hours' },
];
const ATTENDANCE_USER_FIELDS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'shift', label: 'Shift', type: 'string', hasOptions: true },
  { key: 'status', label: 'Status', type: 'string', hasOptions: true },
  { key: 'punchIn', label: 'Punch-In', type: 'time' },
  { key: 'punchOut', label: 'Punch-Out', type: 'time' },
  { key: 'inLocation', label: 'In Location', type: 'string' },
  { key: 'outLocation', label: 'Out Location', type: 'string' },
  { key: 'workedHours', label: 'Worked Hours', type: 'time' },
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

interface SearchBarProps {
  model:string;
  onSearch?: (searchTerm: string, selectedColumns: string[], searchParams?: Record<string, string>) => void;
  columns?: [],
  placeholder?: string;
  className?: string;
  defaultSelectedColumns?: string[];
  defaultOperator?: string; // Default search operator
  showOperatorSelector?: boolean; // Show operator selection UI
}

export default function SearchBar({
  model,
  onSearch,
  columns,
  placeholder = "Search",
  className = "",
  defaultSelectedColumns = [],
  defaultOperator = 'cn',
  showOperatorSelector = false
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(defaultSelectedColumns);
  const [selectedOperator, setSelectedOperator] = useState(defaultOperator);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ left: number; top: number } | null>(null);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getFieldsByModel= ()=>{
    switch(model){
        case "holiday":
            return Holiday_Column;
        case "LeaveRequest":
             return leaveRequest_Column;
        case "LeaveApplied":
             return leaveAppiled_Column;
        case "LeaveRecord":
             return LEAVE_RECORD_FIELDS;
        case "attendanceAdmin":
             return ATTENDANCE_ADMIN_FIELDS;
        case "LeaveType":
             return LEAVE_TYPE_COLUMN;
        case 'LeaveBalance':
          return LEAVE_BALANCE_COLUMN;
        case "attendanceUser":
             return ATTENDANCE_USER_FIELDS;
        case "shift":
             return SHIFT_FIELDS;
             default:
              return
    }
  }
  const SEARCHABLE_COLUMNS=getFieldsByModel();
  
  useEffect(() => {
  if (SEARCHABLE_COLUMNS && SEARCHABLE_COLUMNS.length > 0 && selectedColumns.length === 0) {
    // Initialize default selected columns only once
    setSelectedColumns(defaultSelectedColumns);
  }
}, [SEARCHABLE_COLUMNS]);

// handle searching on every input value
useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (onSearch) {
      const searchParams = buildSearchParams(searchTerm, selectedColumns, selectedOperator);
      onSearch(searchTerm, selectedColumns, searchParams);
    }
  }, 200); // wait 200ms after typing stops

  return () => clearTimeout(delayDebounce);
}, [searchTerm, selectedColumns, selectedOperator]);

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

  // Handle search input change - only update local state
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Handle Enter key press to trigger search
//   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (e.key === 'Enter') {
//       triggerSearch();
//     }
//   };

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
    const allColumnKeys = (SEARCHABLE_COLUMNS ?? []).map(col => col.key);
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

  const allColumnsSelected = selectedColumns.length === (SEARCHABLE_COLUMNS ?? []).length;
  const someColumnsSelected = selectedColumns.length > 0 && selectedColumns.length < (SEARCHABLE_COLUMNS ?? []).length;

  return (
    <div className={`relative mr-1 ${className}`} ref={searchBarRef}>
      {/* Search Input Container */}
      <div className="relative flex items-center">
        {/* Search Icon - Clickable to trigger search */}
        <button
          type="button"
          onClick={triggerSearch}
          className="absolute inset-y-0 left-0 pl-3  flex items-center hover:opacity-70 transition-opacity"
          title="Search (or press Enter)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-[18px] h-[18px]  text-gray-400"
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
        //   onKeyPress={handleKeyPress}
          className="pl-10 pr-16 w-[150px] py-1 border bg-white border-gray-400 rounded outline-none text-sm"
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

        {/* Operator Indicator (small badge) */}
        {showOperatorSelector && (
          <div className="absolute left-2 top-0 transform -translate-y-1">
            <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {SEARCH_OPERATORS.find(op => op.key === selectedOperator)?.label || selectedOperator}
            </span>
          </div>
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
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] py-2 min-w-[240px]"
          style={{
            left: popoverPosition.left,
            top: popoverPosition.top,
            maxHeight: 'calc(100vh - 16px)',
            overflow: 'auto'
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Search Configuration</h3>
          </div>

          {/* Operator Selection (if enabled) */}
          {showOperatorSelector && (
            <div className="px-3 py-2 border-b border-gray-100">
              <h4 className="text-xs font-medium text-gray-600 mb-2">Search Type</h4>
              <div className="space-y-1">
                {SEARCH_OPERATORS.map((operator) => (
                  <div
                    key={operator.key}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => handleOperatorChange(operator.key)}
                  >
                    <input
                      type="radio"
                      checked={selectedOperator === operator.key}
                      onChange={() => handleOperatorChange(operator.key)}
                      className="w-3 h-3"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{operator.label}</div>
                      <div className="text-xs text-gray-500">{operator.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            {(SEARCHABLE_COLUMNS?? []).map((column) => (
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
                    <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-mono">
                      {column.key === 'name' ? 'N' :
                        column.key === 'status' ? 'S' :
                          column.label.charAt(0).toUpperCase()}
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
              {selectedColumns.length} of {(SEARCHABLE_COLUMNS?? []).length} columns selected
            </div>
            {showOperatorSelector && (
              <div className="text-gray-500 mt-1">
                Using &quot;{SEARCH_OPERATORS.find(op => op.key === selectedOperator)?.label || selectedOperator}&quot; search
              </div>
            )}
            {selectedColumns.length > 0 && searchTerm && (
              <div className="text-blue-600 mt-1">
                Searching in: {selectedColumns.join(', ')}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

