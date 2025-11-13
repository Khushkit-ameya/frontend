'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  Paper,
  Typography,
  Button,
  IconButton,
  Divider,
  Box,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

// Activity field definitions with their types and available operators
const ACTIVITY_FIELDS = [
  // String fields
  { key: 'title', label: 'Activity Title', type: 'string' },
  { key: 'description', label: 'Description', type: 'string' },
  { key: 'assignedToId', label: 'Assigned User ID', type: 'string' },
  { key: 'projectId', label: 'Project ID', type: 'string' },
  { key: 'taskId', label: 'Task ID', type: 'string' },
  { key: 'subTaskId', label: 'Sub Task ID', type: 'string' },
  { key: 'createdById', label: 'Created By ID', type: 'string' },
  { key: 'companyId', label: 'Company ID', type: 'string' },
  
  // Dropdown/Select fields
  { key: 'type', label: 'Activity Type', type: 'string', hasOptions: true, options: ['meeting', 'call', 'notes', 'toDo', 'email'] },
  { key: 'status.statusName', label: 'Status', type: 'string', hasOptions: true, options: ['not-started', 'scheduled', 'in-progress', 'completed', 'cancelled', 'on-hold'] },
  { key: 'status.color', label: 'Status Color', type: 'string' },
  
  // Array fields
  { key: 'documents', label: 'Documents', type: 'string[]' },
  
  // Date fields
  { key: 'scheduleTimeFrom', label: 'Start Time', type: 'date' },
  { key: 'scheduleTimeTo', label: 'End Time', type: 'date' },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' },
];

// Operators available for each field type
const OPERATORS_BY_TYPE: Record<string, Array<{key: string, label: string, description: string}>> = {
  'string': [
    { key: 'eq', label: 'Equals', description: 'Exact match' },
    { key: 'ne', label: 'Not Equals', description: 'Does not match' },
    { key: 'cn', label: 'Contains', description: 'Contains text (case insensitive)' },
    { key: 'nc', label: 'Not Contains', description: 'Does not contain text' },
    { key: 'sw', label: 'Starts With', description: 'Starts with text' },
    { key: 'ew', label: 'Ends With', description: 'Ends with text' },
    { key: 'in', label: 'In List', description: 'Matches any value in comma-separated list' },
    { key: 'nin', label: 'Not In List', description: 'Does not match any value in list' },
  ],
  'string[]': [
    { key: 'eq', label: 'Has Value', description: 'Array contains exact value' },
    { key: 'ne', label: 'Does Not Have', description: 'Array does not contain value' },
    { key: 'cn', label: 'Contains', description: 'Any array item contains text' },
    { key: 'in', label: 'Has Any Of', description: 'Array contains any of the values' },
    { key: 'nin', label: 'Has None Of', description: 'Array contains none of the values' },
  ],
  'date': [
    { key: 'eq', label: 'On Date', description: 'Exact date match' },
    { key: 'ne', label: 'Not On Date', description: 'Not on this date' },
    { key: 'lt', label: 'Before', description: 'Before this date' },
    { key: 'lte', label: 'On or Before', description: 'On or before this date' },
    { key: 'gt', label: 'After', description: 'After this date' },
    { key: 'gte', label: 'On or After', description: 'On or after this date' },
    { key: 'bt', label: 'Between', description: 'Between two dates (start,end)' },
  ],
};

export interface ActivityFilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface ActivityAdvancedFilterPopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ActivityFilterCondition[], queryParams: Record<string, string>) => void;
  initialFilters?: ActivityFilterCondition[];
  title?: string;
}

export default function ActivityAdvancedFilterPopover({ 
  anchorEl, 
  open, 
  onClose, 
  onApplyFilters, 
  initialFilters = [],
  title = "Advanced Activity Filters"
}: ActivityAdvancedFilterPopoverProps) {
  const [filters, setFilters] = useState<ActivityFilterCondition[]>(initialFilters);

  // Initialize with one empty filter if no initial filters
  useEffect(() => {
    if (filters.length === 0) {
      const newFilter: ActivityFilterCondition = {
        id: `filter_${Date.now()}`,
        field: 'title',
        operator: 'cn',
        value: '',
        logicalOperator: undefined,
      };
      setFilters([newFilter]);
    }
  }, [filters.length]);

  // Sync with initial filters when they change
  useEffect(() => {
    if (initialFilters.length > 0) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  const addFilter = () => {
    const newFilter: ActivityFilterCondition = {
      id: `filter_${Date.now()}`,
      field: 'title',
      operator: 'cn',
      value: '',
      logicalOperator: filters.length === 0 ? undefined : 'AND'
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    const newFilters = filters.filter(f => f.id !== filterId);
    // Remove logical operator from first filter if it exists
    if (newFilters.length > 0) {
      newFilters[0].logicalOperator = undefined;
    }
    setFilters(newFilters);
  };

  const updateFilter = (filterId: string, updates: Partial<ActivityFilterCondition>) => {
    setFilters(filters.map(filter => 
      filter.id === filterId 
        ? { ...filter, ...updates }
        : filter
    ));
  };

  const clearAllFilters = () => {
    setFilters([]);
    onApplyFilters([], {}); // Apply empty filters to clear the search
    onClose();
  };

  const getAvailableOperators = (fieldType: string) => {
    return OPERATORS_BY_TYPE[fieldType] || OPERATORS_BY_TYPE['string'];
  };

  const getFieldType = (fieldKey: string) => {
    const field = ACTIVITY_FIELDS.find(f => f.key === fieldKey);
    return field?.type || 'string';
  };

  const getFieldOptions = (fieldKey: string) => {
    const field = ACTIVITY_FIELDS.find(f => f.key === fieldKey);
    return field?.options || [];
  };

  const hasFieldOptions = (fieldKey: string) => {
    const field = ACTIVITY_FIELDS.find(f => f.key === fieldKey);
    return field?.hasOptions || false;
  };

  // Convert filters to API query parameters
  const buildQueryParams = (filterList: ActivityFilterCondition[]): Record<string, string> => {
    const params: Record<string, string> = {};
    
    filterList.forEach(filter => {
      if (filter.field && filter.operator && filter.value.trim()) {
        const paramValue = `${filter.operator}:${filter.value.trim()}`;
        params[filter.field] = paramValue;
      }
    });
    
    return params;
  };

  const applyFilters = () => {
    const validFilters = filters.filter(f => f.field && f.operator && f.value.trim());
    const queryParams = buildQueryParams(validFilters);
    onApplyFilters(validFilters, queryParams);
    onClose();
  };

  const renderValueInput = (filter: ActivityFilterCondition) => {
    const fieldType = getFieldType(filter.field);
    const fieldOptions = getFieldOptions(filter.field);
    const hasOptions = hasFieldOptions(filter.field);

    // For fields with predefined options, show dropdown
    if (hasOptions && fieldOptions.length > 0) {
      return (
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Value</InputLabel>
          <Select
            value={filter.value}
            label="Value"
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          >
            {fieldOptions.map(option => (
              <MenuItem key={option} value={option}>
                {option === 'toDo' ? 'To Do' : option.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // For date fields, show date input
    if (fieldType === 'date') {
      // For between operator, show two date inputs
      if (filter.operator === 'bt') {
        const [startDate, endDate] = filter.value.split(',');
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <input
              type="datetime-local"
              value={startDate || ''}
              onChange={(e) => {
                const newValue = `${e.target.value},${endDate || ''}`;
                updateFilter(filter.id, { value: newValue });
              }}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <Typography variant="body2">to</Typography>
            <input
              type="datetime-local"
              value={endDate || ''}
              onChange={(e) => {
                const newValue = `${startDate || ''},${e.target.value}`;
                updateFilter(filter.id, { value: newValue });
              }}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </Box>
        );
      }

      return (
        <input
          type="datetime-local"
          value={filter.value}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px',
            minWidth: '180px'
          }}
        />
      );
    }

    // For all other fields, show text input
    return (
      <TextField
        size="small"
        label="Value"
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        sx={{ minWidth: 150 }}
        placeholder={
          filter.operator === 'in' || filter.operator === 'nin' 
            ? 'value1,value2,value3'
            : 'Enter value'
        }
        helperText={
          (filter.operator === 'in' || filter.operator === 'nin') 
            ? 'Comma-separated values'
            : ''
        }
      />
    );
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      PaperProps={{
        sx: { 
          width: '600px', 
          maxHeight: '80vh',
          overflow: 'auto'
        }
      }}
    >
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff0000' }}>
            <FilterListIcon sx={{ color: '#ff0000' }} />
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <ClearIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Filter Builder */}
        <Box sx={{ mb: 3 }}>
          {filters.map((filter) => (
            <Box key={filter.id} sx={{ mb: 2 }}>
              {/* Filter Row */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Field Selection */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={filter.field}
                    label="Field"
                    onChange={(e) => updateFilter(filter.id, { 
                      field: e.target.value,
                      operator: 'cn', // Reset operator when field changes
                      value: '' // Reset value when field changes
                    })}
                  >
                    {ACTIVITY_FIELDS.map(field => (
                      <MenuItem key={field.key} value={field.key}>
                        {field.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Operator Selection */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filter.operator}
                    label="Operator"
                    onChange={(e) => updateFilter(filter.id, { 
                      operator: e.target.value,
                      value: filter.operator === 'bt' && e.target.value !== 'bt' ? '' : filter.value // Clear value when switching from/to between
                    })}
                  >
                    {getAvailableOperators(getFieldType(filter.field)).map(op => (
                      <MenuItem key={op.key} value={op.key} title={op.description}>
                        {op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Value Input */}
                {renderValueInput(filter)}

                {/* Remove Filter Button */}
                <IconButton
                  onClick={() => removeFilter(filter.id)}
                  disabled={filters.length === 1}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}

          {/* Add Filter Button */}
          <Button
            startIcon={<AddIcon />}
            onClick={addFilter}
            variant="outlined"
            size="small"
            sx={{ 
              mt: 1,
              color: '#ff0000',
              borderColor: '#ff0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.04)'
              }
            }}
          >
            Add Filter
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={clearAllFilters}
            startIcon={<ClearIcon />}
            variant="outlined"
            size="small"
            sx={{
              color: '#ff0000',
              borderColor: '#ff0000',
              '&:hover': {
                borderColor: '#cc0000',
                backgroundColor: 'rgba(255, 0, 0, 0.04)'
              }
            }}
          >
            Clear All
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} variant="outlined" size="small">
              Cancel
            </Button>
            <Button 
              onClick={applyFilters} 
              variant="contained" 
              size="small"
              disabled={filters.every(f => !f.field || !f.operator || !f.value.trim())}
              sx={{
                bgcolor: '#ff0000',
                '&:hover': {
                  bgcolor: '#cc0000'
                },
                '&:disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)'
                }
              }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Paper>
    </Popover>
  );
}