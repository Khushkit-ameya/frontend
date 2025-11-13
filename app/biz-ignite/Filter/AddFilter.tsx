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
  Chip,
  Stack,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useGetAllLeavesNameOnlyQuery } from '@/store/api';
// Using native HTML date inputs instead of Material UI Date Picker to avoid dependency conflicts

// Project field definitions with their types and available operators

// Holiday field definitions with their type
const HOLIDAY_FIELDS = [
  { key: 'name', label: 'Holiday Name', type: 'string' },
  { key: 'holidayType', label: 'Holiday Type', type: 'string', hasOptions: true },
  { key: 'fromDate', label: 'From Date', type: 'date' },
  { key: 'toDate', label: 'To Date', type: 'date' },
  { key: 'description', label: 'Description', type: 'string' },
];
// Admin Attendance field definitions with their type
const ATTENDANCE_ADMIN_FIELDS = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'date', label: 'Date', type: 'date' },
  // { key: 'phone', label: 'Phone', type: 'string' },
  { key: 'email', label: 'Email', type: 'string' },
  { key: 'role', label: 'Role', type: 'string', hasOptions: true },
  { key: 'shift', label: 'Shift', type: 'string', hasOptions: true },
  { key: 'astatus', label: 'Status', type: 'string', hasOptions: true },
  { key: 'punchIn', label: 'Punch-In', type: 'time' },
  { key: 'punchOut', label: 'Punch-Out', type: 'time' },
  { key: 'inLocation', label: 'In Location', type: 'string' },
  { key: 'outLocation', label: 'Out Location', type: 'string' },
  { key: 'workedHours', label: 'Worked Hours', type: 'time' },
];
// Admin Attendance field definitions with their type
const ATTENDANCE_USER_FIELDS = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'shift', label: 'Shift', type: 'string', hasOptions: true },
  { key: 'astatus', label: 'Status', type: 'string', hasOptions: true },
  { key: 'punchIn', label: 'Punch-In', type: 'time' },
  { key: 'punchOut', label: 'Punch-Out', type: 'time' },
  { key: 'inLocation', label: 'In Location', type: 'string' },
  { key: 'outLocation', label: 'Out Location', type: 'string' },
  { key: 'workedHours', label: 'Worked Hours', type: 'time' },
];
// Admin Attendance field definitions with their type
const LEAVE_RECORDS_FIELDS = [
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'used', label: 'Used', type: 'number' },
  { key: 'remaining', label: 'Remaining', type: 'number' },
];
const REQUEST_FIELDS = [
  {
    key: "name",
    label: "Employee Name",
    type: "text", // free text search
    operators: ["contains", "equals", "startsWith"]
  },
  {
    key: "role",
    label: "Role",
    type: "select",
    operators: ["equals"],
    options: [] // dynamically populate from API
  },
  {
    key: "leaveType",
    label: "Leave Type",
    type: "select",
    operators: ["equals"],
    options: [] // SL / PL / FL etc
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    operators: ["equals"],
    options: [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" }
    ]
  },
  {
    key: "astatus",
    label: "aStatus",
    type: "select",
    operators: ["equals"],
    options: [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" }
    ]
  },
  {
    key: "fromDate",
    label: "From Date",
    type: "date",
    operators: ["gte", "lte", "between"]
  },
  {
    key: "toDate",
    label: "To Date",
    type: "date",
    operators: ["gte", "lte", "between"]
  },
  {
    key: "days",
    label: "No. of Days",
    type: "number",
    operators: ["equals", "gte", "lte"]
  },
  {
    key: "reason",
    label: "Reason",
    type: "text",
    operators: ["contains"]
  },
  {
    key: "comments",
    label: "Comments",
    type: "text",
    operators: ["contains"]
  },
  {
    key: "approvedBy",
    label: "Approved By",
    type: "select",
    operators: ["equals"],
  }
]

const APPLIED_FIELDS = [
  {
    key: "leaveType",
    label: "Leave Type",
    type: "string",
    hasOptions: true,
  },
  {
    key: "status",
    label: "Status",
    type: "string",
    hasOptions: true,
  },
  {
    key: "astatus",
    label: "Status",
    type:"string",
    hasOptions:true,
  },
  {
    key: "from",
    label: "From Date",
    type: "date",
  },
  {
    key: "to",
    label: "To Date",
    type: "date",
    operators: ["gte", "lte", "between"]
  },
  {
    key: "noOfDays",
    label: "No. of Days",
    type: "number",
  },
  {
    key: "reason",
    label: "Reason",
    type: "string",
  },
  {
    key: "comments",
    label: "Comments",
    type: "string",
    operators: ["contains"]
  },
  {
    key: "approvedBy",
    label: "Approved By",
    hasOptions: true,
    type: "string"
  }
]

const LEAVE_TYPE_FIELDS = [
  { key: 'name', label: 'Leave Type', hasOptions: true, type: "string" },
  { key: 'available', label: 'Allocated Day', type: "number" },
  { key: 'year', label: 'Year', type: "number" }
]

const LEAVE_BALANCE_FIELDS = [
  { key: 'name', label: 'Leave Type', hasOptions: true, type: "string" },
  { key: 'available', label: 'Remaining Day', type: "number" },
  { key: 'booked', label: 'Used Day', type: "number" },
  { key: 'year', label: 'Year', type: "number" }
]
// Operators available for each field type
const OPERATORS_BY_TYPE: Record<string, Array<{ key: string, label: string, description: string }>> = {
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
  'number': [
    { key: 'eq', label: 'Equals', description: 'Exact number match' },
    { key: 'ne', label: 'Not Equals', description: 'Does not equal number' },
    { key: 'lt', label: 'Less Than', description: 'Less than number' },
    { key: 'lte', label: 'Less Than or Equal', description: 'Less than or equal to number' },
    { key: 'gt', label: 'Greater Than', description: 'Greater than number' },
    { key: 'gte', label: 'Greater Than or Equal', description: 'Greater than or equal to number' },
    { key: 'bt', label: 'Between', description: 'Between two numbers (min,max)' },
    { key: 'in', label: 'In List', description: 'Matches any number in comma-separated list' },
  ],
  'date': [
    { key: 'eq', label: 'On Date', description: 'Exact date match' },
    { key: 'ne', label: 'Not On Date', description: 'Not on this date' },
    { key: 'lt', label: 'Before', description: 'Before this date' },
    { key: 'lte', label: 'On or Before', description: 'On or before this date' },
    { key: 'gt', label: 'After', description: 'After this date' },
    { key: 'gte', label: 'On or After', description: 'On or after this date' },
    { key: 'bt', label: 'Between Dates', description: 'Between two dates' },
  ],
  'time': [
    { key: 'eq', label: 'Equals', description: 'Exact time match' },
    { key: 'ne', label: 'Not Equals', description: 'Does not equal this time' },
    { key: 'lt', label: 'Before', description: 'Before this time' },
    { key: 'lte', label: 'On or Before', description: 'On or before this time' },
    { key: 'gt', label: 'After', description: 'After this time' },
    { key: 'gte', label: 'On or After', description: 'On or after this time' },
    { key: 'bt', label: 'Between Times', description: 'Between two times (start,end)' },
  ],
  'object[]': [
    { key: 'eq', label: 'Contains', description: 'Array contains object with value' },
    { key: 'ne', label: 'Does Not Contain', description: 'Array does not contain object' },
    { key: 'in', label: 'Contains Any Of', description: 'Array contains any of the objects' },
  ]
};

// Sample options for dropdown fields (in real app, these would come from API)
const FIELD_OPTIONS: Record<string, string[]> = {
  status: ['Active', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
  astatus: ['Persent', 'Late', 'Half Day', 'Absent'], //for attendance status
  priority: ['Low', 'Medium', 'High', 'Critical'],
  projectType: ['Development', 'Design', 'Marketing', 'Research', 'Maintenance'],
  managerId: ['Manager 1', 'Manager 2', 'Manager 3'], // In real app, fetch from users API
  holidayType: ['PUBLIC', 'COMPANY', 'REGIONAL', 'OPTIONAL'],
  leaveType: ['SICK_LEAVE', 'CASUAL_LEAVE', 'ANNUAL_LEAVE', 'MATERNITY_LEAVE', 'EMERGENCY_LEAVE', 'UNPAID_LEAVE', 'COMPENSATORY_LEAVE'],
  name: ['SICK_LEAVE', 'CASUAL_LEAVE', 'ANNUAL_LEAVE', 'MATERNITY_LEAVE', 'EMERGENCY_LEAVE', 'UNPAID_LEAVE', 'COMPENSATORY_LEAVE']
};
const SHIFT_FIELDS=[
  {key:'firstName', label:'User First Name',type:'string'},
  {key:'lastName', label:'User Last Name',type:'string'},
  {key:'email', label:'User Email',type:'string'},
  {key:'role', label:'User Role',type:'string'},
]
export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  fieldType: string;
}

interface AdvancedFilterPopoverProps {
  modelType: string;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCondition[], queryParams: Record<string, string>) => void;
  initialFilters?: FilterCondition[];
  title?: string;
  availableFields?: { label: string; value: string; type: string }[]; //dynamicLeaveFields
}

export default function AdvancedFilter({
  modelType,
  anchorEl,
  open,
  onClose,
  onApplyFilters,
  initialFilters = [],
  title = "Advanced Filters",
  availableFields,
}: AdvancedFilterPopoverProps) {
  const [filters, setFilters] = useState<FilterCondition[]>(initialFilters);
  const [savedFilters, setSavedFilters] = useState<{ name: string, filters: FilterCondition[] }[]>([]);
  const { data: leaveNameData } = useGetAllLeavesNameOnlyQuery({})

  const FIELD_OPTIONS: Record<string, string[]> = {
    status: ['Active', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    priority: ['Low', 'Medium', 'High', 'Critical'],
    projectType: ['Development', 'Design', 'Marketing', 'Research', 'Maintenance'],
    managerId: ['Manager 1', 'Manager 2', 'Manager 3'], 
    holidayType: ['PUBLIC', 'COMPANY', 'REGIONAL', 'OPTIONAL'],
    leaveType:
      leaveNameData?.data?.map(
        (leave) => leave?.leaveName
      ) || [],
    name:
      leaveNameData?.data?.map(
        (leave) => leave?.leaveName
      ) || [],
  };


  const getFieldsByModel = () => {
    switch (modelType) {
      case "holiday":
        return HOLIDAY_FIELDS;
      case "LeaveRequest":
        return REQUEST_FIELDS;
      case "LeaveApplied":
        return APPLIED_FIELDS;
      case 'LeaveType':
        return LEAVE_TYPE_FIELDS;
      case 'LeaveBalance':
        return LEAVE_BALANCE_FIELDS;
      case "attendanceAdmin":
        return ATTENDANCE_ADMIN_FIELDS;
      case "attendanceUser":
        return ATTENDANCE_USER_FIELDS;
      case "shift":
        return SHIFT_FIELDS;
      case "userLeaveBalance":
        return LEAVE_RECORDS_FIELDS;
        // return [
        //   ...LEAVE_RECORDS_FIELDS,
        //   ...(availableFields?.map(f => ({
        //     key: f.value,
        //     label: f.label,
        //     type: f.type || "number",
        //   })) || []),
        // ];
      default:
        return [];
    }
  };

  const selectedFields = getFieldsByModel();

  // Initialize with at least one empty filter
  useEffect(() => {
    if (filters.length === 0) {
      addNewFilter();
    }
  }, []);

  // Add a new empty filter condition
  const addNewFilter = () => {
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      field: '',
      operator: '',
      value: '',
      fieldType: ''
    };
    setFilters(prev => [...prev, newFilter]);
  };

  // Remove a filter condition
  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId));
  };

  // Update a filter condition
  const updateFilter = (filterId: string, updates: Partial<FilterCondition>) => {
    setFilters(prev => prev.map(f =>
      f.id === filterId ? { ...f, ...updates } : f
    ));
  };

  // Handle field selection change
  const handleFieldChange = (filterId: string, fieldKey: string) => {
    const field = selectedFields.find(f => f.key === fieldKey);
    if (!field) return;

    const availableOperators = OPERATORS_BY_TYPE[field.type] || [];
    const defaultOperator = availableOperators[0]?.key || '';

    updateFilter(filterId, {
      field: fieldKey,
      fieldType: field.type,
      operator: defaultOperator,
      value: ''
    });
  };

  // Handle operator change
  const handleOperatorChange = (filterId: string, operatorKey: string) => {
    updateFilter(filterId, { operator: operatorKey });
  };

  // Handle value change
  const handleValueChange = (filterId: string, value: string) => {
    updateFilter(filterId, { value });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters([]);
    addNewFilter();
  };

  // Build query parameters for API
  const buildQueryParams = (filterList: FilterCondition[]): Record<string, string> => {
    const params: Record<string, string> = {};

    filterList.forEach(filter => {
      if (filter.field && filter.operator && filter.value.trim()) {
        // Format: fieldName=operator:value
        params[filter.field] = `${filter.operator}:${filter.value.trim()}`;
      }
    });

    return params;
  };

  // Apply filters
  const handleApplyFilters = () => {
    const validFilters = filters.filter(f => f.field && f.operator && f.value.trim());
    const queryParams = buildQueryParams(validFilters);
    onApplyFilters(validFilters, queryParams);
    onClose();
  };

  // Get available operators for a field
  const getAvailableOperators = (fieldType: string) => {
    return OPERATORS_BY_TYPE[fieldType] || [];
  };

  // Get field options for dropdown fields
  const getFieldOptions = (fieldKey: string) => {
    return FIELD_OPTIONS[fieldKey] || [];
  };

  // Render value input based on field type and operator
  const renderValueInput = (filter: FilterCondition) => {
    const field = selectedFields.find(f => f.key === filter.field);
    if (!field || !filter.operator) return null;

    const commonProps = {
      size: 'small' as const,
      fullWidth: true,
      value: filter.value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(filter.id, e.target.value),
    };

    // Handle date inputs
    if (field.type === 'date') {
      if (filter.operator === 'bt') {
        // Between dates - expect comma-separated values
        const [startDate, endDate] = filter.value.split(',').map(d => d.trim());
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              value={startDate || ''}
              onChange={(e) => {
                const newStartDate = e.target.value;
                const currentEndDate = endDate || '';
                handleValueChange(filter.id, `${newStartDate},${currentEndDate}`);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
            <Typography variant="body2" color="text.secondary">to</Typography>
            <TextField
              label="To Date"
              type="date"
              size="small"
              value={endDate || ''}
              onChange={(e) => {
                const newEndDate = e.target.value;
                const currentStartDate = startDate || '';
                handleValueChange(filter.id, `${currentStartDate},${newEndDate}`);
              }}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
          </Box>
        );
      } else {
        // Single date
        return (
          <TextField
            label="Date"
            type="date"
            size="small"
            fullWidth
            value={filter.value || ''}
            onChange={(e) => handleValueChange(filter.id, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      }
    }

    // Handle time inputs
    if (field.type === 'time') {
      if (filter.operator === 'bt') {
        // Between times - expect comma-separated values
        const [startTime, endTime] = filter.value.split(',').map(t => t.trim());
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="From Time"
              type="time"
              size="small"
              value={startTime || ''}
              onChange={(e) => {
                const newStart = e.target.value;
                handleValueChange(filter.id, `${newStart},${endTime || ''}`);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 120 }}
            />
            <Typography variant="body2" color="text.secondary">to</Typography>
            <TextField
              label="To Time"
              type="time"
              size="small"
              value={endTime || ''}
              onChange={(e) => {
                const newEnd = e.target.value;
                handleValueChange(filter.id, `${startTime || ''},${newEnd}`);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 120 }}
            />
          </Box>
        );
      } else {
        return (
          <TextField
            label="Time"
            type="time"
            size="small"
            fullWidth
            value={filter.value || ''}
            onChange={(e) => handleValueChange(filter.id, e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );
      }
    }


    // Handle number inputs
    if (field.type === 'number') {
      if (filter.operator === 'bt') {
        // Between numbers - expect comma-separated values
        return (
          <TextField
            {...commonProps}
            type="text"
            placeholder="min,max (e.g., 10,50)"
            helperText="Enter two numbers separated by comma"
          />
        );
      } else {
        return (
          <TextField
            {...commonProps}
            type="number"
            placeholder="Enter number"
          />
        );
      }
    }

    // Handle dropdown fields with options
    if ('hasOptions' in field && field.hasOptions && FIELD_OPTIONS[field.key]) {
      const options = getFieldOptions(field.key);

      if (filter.operator === 'in' || filter.operator === 'nin') {
        // Multi-select for "in" and "not in" operators
        const selectedValues = filter.value ? filter.value.split(',').map(v => v.trim()) : [];

        return (
          <Autocomplete
            multiple
            options={options}
            value={selectedValues}
            onChange={(_, newValue) => handleValueChange(filter.id, newValue.join(', '))}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Select options"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...otherProps } = getTagProps({ index });
                return (
                  <Chip
                    key={`${option}-${index}`}
                    variant="outlined"
                    label={option}
                    size="small"
                    {...otherProps}
                  />
                );
              })
            }
          />
        );
      } else {
        // Single select for other operators
        return (
          <FormControl fullWidth size="small">
            <Select
              value={filter.value}
              onChange={(e) => handleValueChange(filter.id, e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select option</em>
              </MenuItem>
              {options.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
    }

    // Handle array fields
    if (field.type.endsWith('[]')) {
      if (filter.operator === 'in' || filter.operator === 'nin') {
        return (
          <TextField
            {...commonProps}
            placeholder="value1, value2, value3"
            helperText="Comma-separated values"
          />
        );
      }
    }

    // Default text input
    return (
      <TextField
        {...commonProps}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        helperText={
          filter.operator === 'in' || filter.operator === 'nin'
            ? "Comma-separated values"
            : undefined
        }
      />
    );
  };

  // Count active filters
  const activeFiltersCount = filters.filter(f => f.field && f.operator && f.value.trim()).length;

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
          width: "fit-content",
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Paper elevation={0} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon sx={{ color: '#e7000b' }} />
              <Typography variant="h6">{title}</Typography>
              {activeFiltersCount > 0 && (
                <Chip
                  label={`${activeFiltersCount} active`}
                  size="small"
                  sx={{
                    borderColor: '#e7000b',
                    color: '#e7000b'
                  }}
                  variant="outlined"
                />
              )}
            </Box>
            <IconButton onClick={onClose} size="small">
              <ClearIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Filters List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Stack spacing={2}>
            {filters.map((filter, index) => (
              <Paper
                key={filter.id}
                variant="outlined"
                sx={{ p: 2, bgcolor: 'grey.50' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  {/* Filter number badge */}
                  <Box
                    sx={{
                      minWidth: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: '#e7000b',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      mt: 1
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Filter controls */}
                  <Box sx={{ flex: 1 }}>
                    <Stack spacing={2}>
                      {/* Field and Operator Row */}
                      <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }} className='relative w-full'>
                        {/* Field Selection */}
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel>Field</InputLabel>
                          <Select
                            value={filter.field}
                            label="Field"
                            onChange={(e) => handleFieldChange(filter.id, e.target.value)}
                          >
                            {selectedFields.map(field => (
                              <MenuItem key={field.key} value={field.key}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {/* Field type indicator */}
                                  <Typography
                                    component="div"
                                    variant="body2"
                                    sx={{
                                      bgcolor:
                                        field.type === 'string' ? 'green.50' :
                                          field.type === 'number' ? '#fdedef' :
                                            field.type === 'date' ? 'orange.50' :
                                              field.type === 'time' ? 'orange.50' :
                                                field.type.endsWith('[]') ? 'purple.50' :
                                                  'grey.50',
                                      color:
                                        field.type === 'string' ? 'green.700' :
                                          field.type === 'number' ? '#e7000b' :
                                            field.type === 'date' ? 'orange.700' :
                                              field.type === 'time' ? 'orange.700' :
                                                field.type.endsWith('[]') ? 'purple.700' :
                                                  'grey.700',
                                      px: 0,
                                      py: 0.25,
                                      borderRadius: 0.5,
                                      fontWeight: 500,
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    <div className="main flex gap-2 items-center">
                                      <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center font-mono">
                                        {field.key === 'name' ? 'N' :
                                          field.key === 'status' ? 'S' :
                                            field.label.charAt(0).toUpperCase()}
                                      </div>
                                      {field.label}
                                    </div>

                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Operator Selection */}
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Operator</InputLabel>
                          <Select
                            value={filter.operator}
                            label="Operator"
                            onChange={(e) => handleOperatorChange(filter.id, e.target.value)}
                            disabled={!filter.field}
                          >
                            {getAvailableOperators(filter.fieldType).map(operator => (
                              <MenuItem key={operator.key} value={operator.key}>
                                <Tooltip title={operator.description} placement="left">
                                  <span>{operator.label}</span>
                                </Tooltip>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {/* Value Input Row */}
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            {renderValueInput(filter)}
                          </Box>
                        </Box>
                        {/* Remove Filter Button */}
                        <IconButton
                          onClick={() => removeFilter(filter.id)}
                          size="small"
                          color="error"
                          disabled={filters.length === 1}
                          className='float-right '
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Stack>
                  </Box>

                </Box>
              </Paper>
            ))}
          </Stack>

          {/* Add New Filter Button */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addNewFilter}
              size="small"
            >
              Add Filter Condition
            </Button>
          </Box>
        </Box>

        {/* Footer Actions */}
        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button
              variant="text"
              color="error"
              onClick={clearAllFilters}
              size="small"
              disabled={filters.length === 1 && !filters[0].field}
            >
              Clear All
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              disabled={activeFiltersCount === 0}
              startIcon={<FilterListIcon />}
            >
              Apply Filters ({activeFiltersCount})
            </Button>
          </Box>
        </Box>
      </Paper>
    </Popover>
  );
}















