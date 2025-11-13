'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface PersonFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Array<{
    id: string;
    name: string;
    email?: string;
    role?: unknown;
    avatar?: string;
  }>;
  selectedPeople?: string[];
  onApply?: (selectedIds: string[]) => void;
  className?: string;
  filterFields?: Array<'assignedTo' | 'createdBy'>;
  selectedFilterField?: 'assignedTo' | 'createdBy';
  onFilterFieldChange?: (field: 'assignedTo' | 'createdBy') => void;
}

const PersonFilterModal: React.FC<PersonFilterModalProps> = ({
  isOpen,
  onClose,
  people,
  selectedPeople = [],
  onApply,
  className = '',
  filterFields = ['assignedTo', 'createdBy'],
  selectedFilterField = 'assignedTo',
  onFilterFieldChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedPeople));
  const [activeFilterField, setActiveFilterField] = useState<'assignedTo' | 'createdBy'>(selectedFilterField);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(new Set(selectedPeople));
  }, [selectedPeople]);

  useEffect(() => {
    setActiveFilterField(selectedFilterField);
  }, [selectedFilterField]);

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

  const filteredPeople = people.filter(person => {
    const q = searchQuery.toLowerCase();
    const nameHit = person.name.toLowerCase().includes(q);
    const emailHit = typeof person.email === 'string' && person.email.toLowerCase().includes(q);
    const roleText = getRoleLabel(person.role).toLowerCase();
    const roleHit = roleText.includes(q);
    return nameHit || emailHit || roleHit;
  });

  const togglePerson = (personId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(personId)) {
      newSelected.delete(personId);
    } else {
      newSelected.add(personId);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    if (selected.size === filteredPeople.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredPeople.map(p => p.id)));
    }
  };

  const handleClearAll = () => {
    setSelected(new Set());
    onApply?.([]);
    onClose();
  };

  const handleFilterFieldChange = (field: 'assignedTo' | 'createdBy') => {
    setActiveFilterField(field);
    onFilterFieldChange?.(field);
  };

  const handleApply = () => {
    onApply?.(Array.from(selected));
    onClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  function getRoleLabel(role: unknown): string {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role !== null && 'name' in (role as Record<string, unknown>)) {
      const n = (role as { name?: unknown }).name;
      return typeof n === 'string' ? n : '';
    }
    return '';
  }

  const getFilterFieldLabel = (field: 'assignedTo' | 'createdBy') => {
    return field === 'assignedTo' ? 'Assigned To' : 'Created By';
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 bg-white border border-gray-300 rounded-md ${className}`}
      style={{
        width: '420px',
        top: '54px',
        right: '90px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxHeight: '600px',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Filter by Person</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-900"
              type="button"
            >
              Clear all
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter Field Selector - Only show if multiple fields available */}
        {filterFields.length > 1 && (
          <div className="mb-3 flex gap-2">
            {filterFields.map(field => (
              <button
                key={field}
                onClick={() => handleFilterFieldChange(field)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded border transition-colors ${
                  activeFilterField === field
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                type="button"
              >
                {getFilterFieldLabel(field)}
              </button>
            ))}
          </div>
        )}

        {/* Current filter field indicator */}
        {filterFields.length === 1 && (
          <div className="mb-3 px-3 py-2 bg-gray-50 rounded border border-gray-200">
            <span className="text-xs text-gray-600">
              Filtering by: <span className="font-medium">{getFilterFieldLabel(activeFilterField)}</span>
            </span>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
              style={{ fontFamily: 'Inter', fontSize: '14px' }}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
          </div>
        </div>

        {/* Select All Checkbox */}
        <div className="mb-2">
          <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === filteredPeople.length && filteredPeople.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 font-medium">
              Select All ({filteredPeople.length})
            </span>
          </label>
        </div>

        {/* People List */}
        <div className="max-h-[320px] overflow-y-auto border-t border-gray-200 pt-2">
          {filteredPeople.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No people found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPeople.map((person) => (
                <label
                  key={person.id}
                  className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(person.id)}
                    onChange={() => togglePerson(person.id)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-medium">
                        {getInitials(person.name)}
                      </div>
                    )}
                  </div>

                  {/* Person Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {person.name}
                    </div>
                    {(person.email || getRoleLabel(person.role)) && (
                      <div className="text-xs text-gray-500 truncate">
                        {getRoleLabel(person.role) && <span>{getRoleLabel(person.role)}</span>}
                        {getRoleLabel(person.role) && person.email && <span> • </span>}
                        {person.email && <span>{person.email}</span>}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Selected Count */}
        {selected.size > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-2">
              {selected.size} {selected.size === 1 ? 'person' : 'people'} selected
            </div>
          </div>
        )}

        {/* Apply Button */}
        <div className="flex justify-end pt-3 border-t border-gray-200 mt-3">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            type="button"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonFilterModal;