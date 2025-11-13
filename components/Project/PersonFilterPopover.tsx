"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Popover, IconButton, Checkbox, FormControlLabel, Box, Typography, Button, Divider } from '@mui/material';
import { Users, X } from 'lucide-react';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import { customToast as toast } from '@/utils/toast';

interface PersonFilterPopoverProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onApplyFilter: (selectedUsers: string[], filterType: 'manager' | 'team' | 'both', assignmentType: 'task' | 'subtask' | 'both') => void;
    currentFilters?: {
        managerIds?: string[];
        teamIds?: string[];
        assignmentType?: 'task' | 'subtask' | 'both';
    };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function PersonFilterPopover({
    anchorEl,
    open,
    onClose,
    onApplyFilter,
    currentFilters = {}
}: PersonFilterPopoverProps) {
    const { data: companyUsersData, isLoading: usersLoading } = useGetCompanyUsersQuery({});
    
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [filterType, setFilterType] = useState<'manager' | 'team' | 'both'>('both');
    const [assignmentType, setAssignmentType] = useState<'task' | 'subtask' | 'both'>('both');

    // Initialize selected users from current filters
    useEffect(() => {
        if (currentFilters.managerIds && currentFilters.teamIds) {
            // If both filters are set
            const combinedUsers = Array.from(new Set([...currentFilters.managerIds, ...currentFilters.teamIds]));
            setSelectedUsers(combinedUsers);
            setFilterType('both');
        } else if (currentFilters.managerIds) {
            setSelectedUsers(currentFilters.managerIds);
            setFilterType('manager');
        } else if (currentFilters.teamIds) {
            setSelectedUsers(currentFilters.teamIds);
            setFilterType('team');
        }
        
        // Set assignment type if provided
        if (currentFilters.assignmentType) {
            setAssignmentType(currentFilters.assignmentType);
        }
    }, [currentFilters, open]);

    const users = useMemo(() => {
        const userList = companyUsersData?.users || [];
        return userList as User[];
    }, [companyUsersData]);

    const handleUserToggle = (userId: string) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map((user: User) => user.id));
        }
    };

    const handleApply = () => {
        console.log('Apply button clicked with:', { selectedUsers, filterType, assignmentType });
        if (selectedUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }
        console.log('Calling onApplyFilter with:', selectedUsers, filterType, assignmentType);
        onApplyFilter(selectedUsers, filterType, assignmentType);
        onClose();
    };

    const handleClear = () => {
        setSelectedUsers([]);
        setFilterType('both');
        setAssignmentType('both');
        onApplyFilter([], 'both', 'both');
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
                    width: '350px',
                    maxHeight: '500px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users size={20} />
                        <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                            Filter by Person
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose}>
                        <X size={18} />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Filter Type Selection */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '14px' }}>
                        Filter Type
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filterType === 'manager'}
                                    onChange={() => setFilterType('manager')}
                                    size="small"
                                />
                            }
                            label="Manager"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filterType === 'team'}
                                    onChange={() => setFilterType('team')}
                                    size="small"
                                />
                            }
                            label="Team Members"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filterType === 'both'}
                                    onChange={() => setFilterType('both')}
                                    size="small"
                                />
                            }
                            label="Both (Manager OR Team)"
                        />
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Assignment Type Selection - Task vs Subtask */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '14px' }}>
                        Show Tasks Assigned To
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={assignmentType === 'task'}
                                    onChange={() => setAssignmentType('task')}
                                    size="small"
                                />
                            }
                            label="Task Level Only"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={assignmentType === 'subtask'}
                                    onChange={() => setAssignmentType('subtask')}
                                    size="small"
                                />
                            }
                            label="Subtask Level Only"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={assignmentType === 'both'}
                                    onChange={() => setAssignmentType('both')}
                                    size="small"
                                />
                            }
                            label="Both (Task OR Subtask)"
                        />
                    </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Select All / Deselect All */}
                <Box sx={{ mb: 2 }}>
                    <Button
                        size="small"
                        onClick={handleSelectAll}
                        sx={{ textTransform: 'none', fontSize: '13px' }}
                    >
                        {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                    </Button>
                </Box>

                {/* Users List */}
                <Box sx={{ maxHeight: '250px', overflowY: 'auto', mb: 2 }}>
                    {usersLoading ? (
                        <Typography sx={{ textAlign: 'center', py: 2, fontSize: '14px' }}>
                            Loading users...
                        </Typography>
                    ) : users.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', py: 2, fontSize: '14px', color: 'text.secondary' }}>
                            No users found
                        </Typography>
                    ) : (
                        users.map((user: User) => (
                            <FormControlLabel
                                key={user.id}
                                control={
                                    <Checkbox
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleUserToggle(user.id)}
                                        size="small"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                                            {user.firstName} {user.lastName}
                                        </Typography>
                                        <Typography sx={{ fontSize: '12px', color: 'text.secondary' }}>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                }
                                sx={{ width: '100%', mb: 1 }}
                            />
                        ))
                    )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClear}
                        sx={{ textTransform: 'none' }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleApply}
                        disabled={selectedUsers.length === 0}
                        sx={{
                            textTransform: 'none',
                            backgroundColor: '#c81c1f',
                            '&:hover': {
                                backgroundColor: '#a01618',
                            }
                        }}
                    >
                        Apply ({selectedUsers.length})
                    </Button>
                </Box>
            </Box>
        </Popover>
    );
}
