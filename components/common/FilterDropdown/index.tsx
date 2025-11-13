'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface FilterCondition {
  id: string;
  field: string;
  condition: string;
  value: string[];
  logicalOperator: 'AND' | 'OR';
}

// Minimal shape used by this component for saved filters list
export interface SavedFilterSummary {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Array<{ value: string; label: string; fieldType?: string; isSearchable?: boolean }>;
  currentFilters?: FilterCondition[];
  onApplyFilters?: (filters: FilterCondition[]) => void;
  hasActiveFilters?: boolean;
  className?: string;
  savedFilters?: SavedFilterSummary[]; // Minimal subset; backend can pass extra fields safely
  onLoadSavedFilter?: (filterId: string) => void;
  onSaveFilter?: (filterName: string, filters: FilterCondition[]) => void;
  onDeleteSavedFilter?: (filterId: string) => void;
}

const getConditionsForFieldType = (fieldType?: string) => {
  switch (fieldType) {
    case 'TEXT':
    case 'EMAIL':
    case 'PHONE':
    case 'URL':
    case 'TEXTAREA':
      return [
        { value: 'CONTAINS', label: 'contains' },
        { value: 'DOES_NOT_CONTAIN', label: 'does not contain' },
        { value: 'IS', label: 'is' },
        { value: 'IS_NOT', label: 'is not' },
        { value: 'STARTS_WITH', label: 'starts with' },
        { value: 'ENDS_WITH', label: 'ends with' },
        { value: 'IS_EMPTY', label: 'is empty' },
        { value: 'IS_NOT_EMPTY', label: 'is not empty' },
      ];
    case 'NUMBER':
    case 'CURRENCY':
      return [
        { value: 'EQUALS', label: 'equals' },
        { value: 'NOT_EQUALS', label: 'not equals' },
        { value: 'GREATER_THAN', label: 'greater than' },
        { value: 'GREATER_THAN_OR_EQUAL', label: 'greater than or equal' },
        { value: 'LESS_THAN', label: 'less than' },
        { value: 'LESS_THAN_OR_EQUAL', label: 'less than or equal' },
        { value: 'BETWEEN', label: 'between' },
        { value: 'IS_EMPTY', label: 'is empty' },
        { value: 'IS_NOT_EMPTY', label: 'is not empty' },
      ];
    case 'DATE':
    case 'DATE_RANGE':
    case 'DATE_TIME':
    case 'DATE_TIME_RANGE':
      return [
        { value: 'IS_DATE', label: 'is' },
        { value: 'IS_NOT_DATE', label: 'is not' },
        { value: 'IS_BEFORE', label: 'is before' },
        { value: 'IS_AFTER', label: 'is after' },
        { value: 'IS_ON_OR_BEFORE', label: 'is on or before' },
        { value: 'IS_ON_OR_AFTER', label: 'is on or after' },
        { value: 'DATE_BETWEEN', label: 'between' },
        { value: 'IS_TODAY', label: 'is today' },
        { value: 'IS_YESTERDAY', label: 'is yesterday' },
        { value: 'IS_THIS_WEEK', label: 'is this week' },
        { value: 'IS_THIS_MONTH', label: 'is this month' },
        { value: 'IS_EMPTY', label: 'is empty' },
        { value: 'IS_NOT_EMPTY', label: 'is not empty' },
      ];
    case 'DROPDOWN':
      return [
        { value: 'IS', label: 'is' },
        { value: 'IS_NOT', label: 'is not' },
        { value: 'IN', label: 'is any of' },
        { value: 'NOT_IN', label: 'is none of' },
        { value: 'IS_EMPTY', label: 'is empty' },
        { value: 'IS_NOT_EMPTY', label: 'is not empty' },
      ];
    case 'CHECKBOX':
      return [
        { value: 'IS_TRUE', label: 'is checked' },
        { value: 'IS_FALSE', label: 'is not checked' },
      ];
    default:
      return [
        { value: 'CONTAINS', label: 'contains' },
        { value: 'DOES_NOT_CONTAIN', label: 'does not contain' },
        { value: 'IS', label: 'is' },
        { value: 'IS_NOT', label: 'is not' },
        { value: 'IS_EMPTY', label: 'is empty' },
        { value: 'IS_NOT_EMPTY', label: 'is not empty' },
      ];
  }
};

const conditionNeedsValue = (condition: string): boolean => {
  const noValueConditions = [
    'IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TODAY', 'IS_YESTERDAY',
    'IS_THIS_WEEK', 'IS_LAST_WEEK', 'IS_NEXT_WEEK',
    'IS_THIS_MONTH', 'IS_LAST_MONTH', 'IS_NEXT_MONTH',
    'IS_TRUE', 'IS_FALSE',
  ];
  return !noValueConditions.includes(condition);
};

const conditionSupportsMultipleValues = (condition: string): boolean => {
  const multiValueConditions = [
    'CONTAINS', 'DOES_NOT_CONTAIN', 'IS', 'IS_NOT',
    'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'NOT_EQUALS',
    'IN', 'NOT_IN',
    // Support ranges as two-value inputs
    'BETWEEN', 'DATE_BETWEEN',
  ];
  return multiValueConditions.includes(condition);
};

const getMultiValueHint = (condition: string): string | null => {
  const orConditions = ['CONTAINS', 'IS', 'STARTS_WITH', 'ENDS_WITH', 'EQUALS', 'IN'];
  const andConditions = ['IS_NOT', 'NOT_EQUALS', 'DOES_NOT_CONTAIN', 'NOT_IN'];

  if (condition === 'BETWEEN' || condition === 'DATE_BETWEEN') {
    return 'Enter two values (from and to). Press Enter after each value.';
  }
  if (orConditions.includes(condition)) {
    return 'Multiple values will match ANY (OR logic)';
  }
  if (andConditions.includes(condition)) {
    return 'Multiple values will match ALL (AND logic)';
  }
  return null;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  fields,
  currentFilters,
  onApplyFilters,
  className = '',
  savedFilters = [],
  onLoadSavedFilter,
  onSaveFilter,
  onDeleteSavedFilter,
}) => {
  const visibleFields = useMemo(() => (fields || []).filter(f => f.isSearchable !== false), [fields]);

  const getInitialFilters = (): FilterCondition[] => {
    if (currentFilters && currentFilters.length > 0) {
      return currentFilters;
    }
    // Ensure we have a valid field selected initially
    const firstField = visibleFields[0] || fields[0];
    if (!firstField) {
      return [];
    }
    return [{
      id: '1',
      field: firstField.value,
      condition: 'CONTAINS',
      value: [],
      logicalOperator: 'AND',
    }];
  };

  const [filters, setFilters] = useState<FilterCondition[]>(getInitialFilters());

  const getInitialLogicalOperator = (): 'AND' | 'OR' => {
    if (currentFilters && currentFilters.length > 0) {
      return currentFilters[0]?.logicalOperator || 'AND';
    }
    return 'AND';
  };

  const [globalLogicalOperator, setGlobalLogicalOperator] = useState<'AND' | 'OR'>(getInitialLogicalOperator());
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(false);
  const [saveFilterModalOpen, setSaveFilterModalOpen] = useState(false);
  const [filterNameInput, setFilterNameInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openFieldMenuId, setOpenFieldMenuId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentFilters && currentFilters.length > 0) {
      setFilters(currentFilters);
      setGlobalLogicalOperator(currentFilters[0]?.logicalOperator || 'AND');
    }
  }, [currentFilters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getFieldIcon = (fieldKey: string) => {
    const iconPath = `/${fieldKey}.svg`;
    return (
      <img
        src={iconPath}
        alt=""
        className="w-3 h-3 shrink-0"
        style={{ maxWidth: 'none', maxHeight: 'none' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  };

  const addNewFilter = () => {
    const newFilter: FilterCondition = {
      id: Date.now().toString(),
      field: visibleFields[0]?.value || fields[0]?.value || '',
      condition: 'CONTAINS',
      value: [],
      logicalOperator: 'AND',
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (id: string, key: keyof FilterCondition, value: string | string[]) => {
    setFilters(filters.map(filter => {
      if (filter.id === id) {
        if (key === 'field') {
          const newField = fields.find(f => f.value === value);
          const conditions = getConditionsForFieldType(newField?.fieldType);
          return {
            ...filter,
            [key]: value as string, // Explicitly cast to string
            condition: conditions[0]?.value || 'CONTAINS',
            value: [],
          };
        }
        if (key === 'condition' && !conditionNeedsValue(value as string)) {
          return {
            ...filter,
            [key]: value as string, // Explicitly cast to string
            value: []
          };
        }
        return {
          ...filter,
          [key]: value
        };
      }
      return filter;
    }));
  };

  const removeFilter = (id: string) => {
    if (filters.length === 1) {
      setFilters([{
        id: '1',
        field: fields[0]?.value || '',
        condition: 'CONTAINS',
        value: [],
        logicalOperator: 'AND',
      }]);
    } else {
      setFilters(filters.filter(filter => filter.id !== id));
    }
  };

  const clearAllFilters = () => {
    setFilters([{
      id: '1',
      field: fields[0]?.value || '',
      condition: 'CONTAINS',
      value: [],
      logicalOperator: 'AND',
    }]);
    setInputValues({});
    onApplyFilters?.([]);
    onClose();
  };

  const addValueToFilter = (id: string, newValue: string) => {
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    setFilters(filters.map(filter => {
      if (filter.id === id) {
        if (!filter.value.includes(trimmedValue)) {
          return {
            ...filter,
            value: [...filter.value, trimmedValue]
          };
        }
      }
      return filter;
    }));

    setInputValues(prev => ({ ...prev, [id]: '' }));
  };

  const removeValueFromFilter = (id: string, valueToRemove: string) => {
    setFilters(filters.map(filter => {
      if (filter.id === id) {
        return {
          ...filter,
          value: filter.value.filter(v => v !== valueToRemove)
        };
      }
      return filter;
    }));
  };

  const handleValueKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = inputValues[id] || '';
      addValueToFilter(id, currentValue);
    }
  };

  const handleApplyFilters = () => {
    // Merge any pending text input into filter values before validating
    const withPending = filters.map((f) => {
      const pendingRaw = inputValues[f.id] || '';
      const pending = pendingRaw.trim();
      if (pending && !f.value.includes(pending)) {
        return { ...f, value: [...f.value, pending] };
      }
      return f;
    });

    // Validate required values
    const validFilters = withPending.filter((f) => {
      if (!conditionNeedsValue(f.condition)) return true;
      return f.value && f.value.length > 0;
    });

    // Apply global logical operator
    const filtersWithGlobalOperator = validFilters.map((f) => ({
      ...f,
      logicalOperator: globalLogicalOperator,
    }));

    setFilters(withPending);
    setInputValues({});
    onApplyFilters?.(filtersWithGlobalOperator);
  };

  const handleSaveFilter = () => {
    if (filterNameInput.trim() && onSaveFilter) {
      onSaveFilter(filterNameInput.trim(), filters);
      setSaveFilterModalOpen(false);
      setFilterNameInput('');
    }
  };

  const handleLoadSavedFilter = (filterId: string) => {
    onLoadSavedFilter?.(filterId);
    setSavedFiltersOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 bg-white border border-gray-300 rounded-md ${className}`}
      style={{
        width: '650px',
        top: '54px',
        right: '0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Filter</h3>
            {filters.length > 1 && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded">
                <span className="text-xs text-gray-600">Use</span>
                <select
                  value={globalLogicalOperator}
                  onChange={(e) => setGlobalLogicalOperator(e.target.value as 'AND' | 'OR')}
                  className="text-xs font-medium border-none bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <span className="text-xs text-gray-600">for all conditions</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-600 hover:text-gray-900"
              type="button"
            >
              Clear all
            </button>

            {savedFilters.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setSavedFiltersOpen(!savedFiltersOpen)}
                  className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 border border-gray-300 rounded"
                  type="button"
                >
                  Saved filters ({savedFilters.length})
                  <span>▼</span>
                </button>

                {savedFiltersOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {savedFilters.map(savedFilter => (
                        <div
                          key={savedFilter.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <button
                            onClick={() => handleLoadSavedFilter(savedFilter.id)}
                            className="flex-1 text-left text-sm text-gray-700"
                            type="button"
                          >
                            {savedFilter.name}
                            {savedFilter.isDefault && (
                              <span className="ml-2 text-xs text-red-600">(Default)</span>
                            )}
                          </button>
                          {onDeleteSavedFilter && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSavedFilter(savedFilter.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                              type="button"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {onSaveFilter && (
              <button
                onClick={() => setSaveFilterModalOpen(true)}
                className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 border border-gray-300 rounded"
                type="button"
              >
                Save filter
              </button>
            )}
          </div>
        </div>

        {/* Filter Rows */}
        <div className="space-y-3 mb-3">
          {filters.map((filter, index) => {
            const field = fields.find(f => f.value === filter.field);
            const conditions = getConditionsForFieldType(field?.fieldType);
            const needsValue = conditionNeedsValue(filter.condition);
            const supportsMultiple = conditionSupportsMultipleValues(filter.condition);
            const multiValueHint = getMultiValueHint(filter.condition);

            return (
              <div key={filter.id} className="space-y-2">
                <div className="flex items-start gap-2">
                  {index === 0 ? (
                    <span className="text-xs text-gray-600 w-[50px] pt-2">Where</span>
                  ) : (
                    <span className="text-xs text-gray-600 w-[50px] font-medium pt-2">
                      {globalLogicalOperator}
                    </span>
                  )}

                  {/* Field Dropdown */}
                  <div className="relative" style={{ width: '240px' }}>
                    <button
                      type="button"
                      onClick={() => setOpenFieldMenuId(openFieldMenuId === filter.id ? null : filter.id)}
                      className="w-full h-9 text-left pl-8 pr-3 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-500 truncate"
                      style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '15px', color: '#4F5051' }}
                    >
                      <span className="block truncate">{field?.label || filter.field}</span>
                    </button>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {getFieldIcon(filter.field)}
                    </div>
                    {openFieldMenuId === filter.id && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded shadow-md max-h-60 overflow-y-auto">
                        {visibleFields.map((f) => (
                          <div
                            key={f.value}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                            onClick={() => { updateFilter(filter.id, 'field', f.value); setOpenFieldMenuId(null); }}
                          >
                            {getFieldIcon(f.value)}
                            <span style={{ fontFamily: 'Inter', fontSize: '15px', color: '#4F5051' }}>{f.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Condition Dropdown */}
                  <select
                    value={filter.condition}
                    onChange={(e) => updateFilter(filter.id, 'condition', e.target.value)}
                    className="px-3 h-9 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    style={{ width: '220px', fontFamily: 'Inter', fontSize: '15px', color: '#4F5051' }}
                  >
                    {conditions.map((cond) => (
                      <option key={cond.value} value={cond.value}>
                        {cond.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input with Tags */}
                  {needsValue && (
                    <div className="w-[240px] min-w-[240px] max-w-[240px]">
                      {/* Combined Tags + Input Field */}
                      <div className="w-full h-9 px-2 py-1 border border-gray-300 rounded bg-white focus-within:ring-1 focus-within:ring-red-500 overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar">
                        <div className="flex gap-1 items-center flex-nowrap">
                          {/* Tags Display Inside Input */}
                          {filter.value.map((val, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs"
                            >
                              <span className="text-gray-700">{val}</span>
                              <button
                                onClick={() => removeValueFromFilter(filter.id, val)}
                                className="text-gray-500 hover:text-gray-700 font-bold leading-none"
                                type="button"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {/* Input Field */}
                          <input
                            type="text"
                            value={inputValues[filter.id] || ''}
                            onChange={(e) => setInputValues(prev => ({ ...prev, [filter.id]: e.target.value }))}
                            onKeyDown={(e) => handleValueKeyDown(filter.id, e)}
                            placeholder={filter.value.length === 0 ? (supportsMultiple ? "Type and press Enter" : "Enter value") : ""}
                            className="flex-1 min-w-[120px] outline-none border-none px-1 py-0.5 bg-transparent leading-tight"
                            style={{ fontFamily: 'Inter', fontSize: '15px', color: '#4F5051' }}
                          />
                        </div>
                      </div>
                      {/* Hint Below */}
                      {supportsMultiple && multiValueHint && (
                        <p className="text-xs text-gray-500 italic mt-1">
                          💡 {multiValueHint}
                        </p>
                      )}
                    </div>
                  )}

                  {filters.length > 1 && (
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 text-lg"
                      type="button"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Filter Button */}
        <button
          onClick={addNewFilter}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 mb-3"
          type="button"
        >
          <span>+</span>
          New filter
        </button>

        {/* Apply Button */}
        <div className="flex justify-end pt-3 border-t border-gray-200">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            type="button"
          >
            Apply Filters
          </button>
        </div>
      </div>
      {saveFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Save Filter</h3>
            <input
              type="text"
              value={filterNameInput}
              onChange={(e) => setFilterNameInput(e.target.value)}
              placeholder="Filter name"
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSaveFilterModalOpen(false);
                  setFilterNameInput('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;