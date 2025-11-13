"use client";

import React, { useState, useEffect } from 'react';
import { Popover, IconButton, Box, Typography, Button, Divider, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ArrowUpDown, X } from 'lucide-react';

interface SortOption { 
    field: string;
    label: string;
    category?: 'task' | 'subtask'; // For task mode grouping
}
//dsdjdjhjsd
// Props for the sort/filter popover
interface SortFilterPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onApplySort: (sort: { field: string; direction: 'asc' | 'desc' }) => void;
    currentSort?: {
        field: string;
        direction: 'asc' | 'desc';
    } | null;
    mode?: 'project' | 'task'; // Specify what type of sort options to show
}

// Project sort options
const projectSortOptions: SortOption[] = [
    { field: 'name', label: 'Project Name' },
    { field: 'projectId', label: 'Project ID' },
    { field: 'status', label: 'Status' },
    { field: 'priority', label: 'Priority' },
    { field: 'startDate', label: 'Start Date' },
    { field: 'dueDate', label: 'Due Date' },
    { field: 'createdAt', label: 'Created Date' },
    { field: 'updatedAt', label: 'Updated Date' },
    { field: 'manager', label: 'Manager' },
    { field: 'team', label: 'Team' },
];

// Task sort options
const taskSortOptions: SortOption[] = [
    { field: 'taskId', label: 'Task ID', category: 'task' },
    { field: 'taskName', label: 'Task Name', category: 'task' },
    { field: 'status', label: 'Task Status', category: 'task' },
    { field: 'priority', label: 'Task Priority', category: 'task' },
    { field: 'progress', label: 'Task Progress', category: 'task' },
    { field: 'startDate', label: 'Task Start Date', category: 'task' },
    { field: 'endDate', label: 'Task End Date', category: 'task' },
    { field: 'estimationTime', label: 'Task Estimation Time', category: 'task' },
    { field: 'spentTime', label: 'Task Spent Time', category: 'task' },
    { field: 'createdAt', label: 'Created Date', category: 'task' },
    { field: 'updatedAt', label: 'Updated Date', category: 'task' },
];

export default function SortFilterPopover({
    anchorEl,
    open,
    onClose,
    onApplySort,
    currentSort = { field: 'createdAt', direction: 'desc' },
    mode = 'project'
}: SortFilterPopoverProps) {
    const defaultSort = currentSort || { field: 'createdAt', direction: 'desc' };
    const [selectedField, setSelectedField] = useState<string>(defaultSort.field);
    const [selectedDirection, setSelectedDirection] = useState<'asc' | 'desc'>(defaultSort.direction);

    // Get the appropriate sort options based on mode
    const sortOptions = mode === 'task' ? taskSortOptions : projectSortOptions;
    const sortTitle = mode === 'task' ? 'Sort Tasks' : 'Sort Projects';

    // Update local state when current sort changes
    useEffect(() => {
        if (open) {
            const sortToUse = currentSort || { field: 'createdAt', direction: 'desc' };
            setSelectedField(sortToUse.field);
            setSelectedDirection(sortToUse.direction);
        }
    }, [currentSort, open]);

    const handleApply = () => {
        onApplySort({ field: selectedField, direction: selectedDirection });
        onClose();
    };

    const handleReset = () => {
        setSelectedField('createdAt');
        setSelectedDirection('desc');
        onApplySort({ field: 'createdAt', direction: 'desc' });
        onClose();
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            sx={{
                '& .MuiPopover-paper': {
                    width: '320px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArrowUpDown size={20} />
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                            {sortTitle}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose}>
                        <X size={18} />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Sort Field Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="sort-field-label" sx={{ fontSize: '14px' }}>Sort By</InputLabel>
                    <Select
                        labelId="sort-field-label"
                        value={selectedField}
                        label="Sort By"
                        onChange={(e) => setSelectedField(e.target.value)}
                        size="small"
                        sx={{ fontSize: '14px' }}
                    >
                        {sortOptions.map((option) => (
                            <MenuItem key={option.field} value={option.field} sx={{ fontSize: '14px' }}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Sort Direction Selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="sort-direction-label" sx={{ fontSize: '14px' }}>Order</InputLabel>
                    <Select
                        labelId="sort-direction-label"
                        value={selectedDirection}
                        label="Order"
                        onChange={(e) => setSelectedDirection(e.target.value as 'asc' | 'desc')}
                        size="small"
                        sx={{ fontSize: '14px' }}
                    >
                        <MenuItem value="asc" sx={{ fontSize: '14px' }}>Ascending (A-Z, 0-9, Oldest First)</MenuItem>
                        <MenuItem value="desc" sx={{ fontSize: '14px' }}>Descending (Z-A, 9-0, Newest First)</MenuItem>
                    </Select>
                </FormControl>

                <Divider sx={{ mb: 2 }} />

                {/* Current Sort Info */}
                <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <Typography sx={{ fontSize: '12px', color: 'text.secondary', mb: 0.5 }}>
                        Current Sort
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                        {sortOptions.find(opt => opt.field === selectedField)?.label || selectedField}
                        {' - '}
                        {selectedDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </Typography>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleReset}
                        sx={{ textTransform: 'none' }}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleApply}
                        sx={{
                            textTransform: 'none',
                            backgroundColor: '#c81c1f',
                            '&:hover': {
                                backgroundColor: '#a01618',
                            }
                        }}
                    >
                        Apply Sort
                    </Button>
                </Box>
            </Box>
        </Popover>
    );
}
