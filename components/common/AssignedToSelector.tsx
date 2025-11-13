"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import { useUpdateTaskAssigneeMutation, useUpdateSubtaskAssigneeMutation } from '@/store/api_query/LazyKill/lazyKill.api';
import { Popover, Paper, Typography, Box, InputBase, Button, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { customToast as toast } from '@/utils/toast';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  user: {
    id: string;
    email: string;
  };
  role?: {
    name: string;
  };
}

interface AssignedToSelectorProps {
  taskId: string;
  currentAssignedTo?: User | User[] | string | string[];
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  isSubtask?: boolean;
  parentTaskId?: string; // 🔥 NEW: Parent task ID for subtasks to trigger parent refetch
}

const SearchInput = styled(InputBase)(({ }) => ({
  '& .MuiInputBase-input': {
    padding: '8px 12px',
    paddingLeft: '40px',
  },
}));

const AssignedToSelector: React.FC<AssignedToSelectorProps> = ({
  taskId,
  currentAssignedTo,
  isOpen,
  onClose,
  anchorEl,
  isSubtask = false,
  parentTaskId // 🔥 NEW: Parent task ID
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Fetch all users
  const { data: usersData } = useGetCompanyUsersQuery({});

  const [updateTaskAssignedTo] = useUpdateTaskAssigneeMutation();
  const [updateSubtaskAssignedTo] = useUpdateSubtaskAssigneeMutation();

  // Initialize selected users from current assignedTo
  useEffect(() => {
    if (currentAssignedTo) {
      // Handle if currentAssignedTo is an array of users
      if (Array.isArray(currentAssignedTo)) {
        const users = currentAssignedTo.filter(item => typeof item === 'object') as User[];
        setSelectedUsers(users);
      }
      // Handle if currentAssignedTo is a single User object
      else if (typeof currentAssignedTo === 'object') {
        setSelectedUsers([currentAssignedTo as User]);
      }
    } else {
      setSelectedUsers([]);
    }
  }, [currentAssignedTo]);

  // Get all users - cast to User[] to fix type issues
  const allUsers: User[] = (usersData?.users || []) as User[];

  // Filter users based on search term
  const filteredUsers: User[] = allUsers.filter((user: User) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    const email = user.user?.email?.toLowerCase() || '';
    
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Check if user is selected
  const isUserSelected = (userId: string) => {
    return selectedUsers.some(user => user.id === userId);
  };

  // Toggle user selection (multi-select)
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        // Remove user from selection
        return prev.filter(u => u.id !== user.id);
      } else {
        // Add user to selection
        return [...prev, user];
      }
    });
  };

  // Clear all selections
  const clearSelection = (userIdToRemove?: string) => {
    if (userIdToRemove) {
      setSelectedUsers(prev => prev.filter(u => u.id !== userIdToRemove));
    } else {
      setSelectedUsers([]);
    }
  };

  // Apply selection (update task/subtask assignedTo)
  const handleApply = async () => {
    try {
      if (selectedUsers.length === 0) {
        toast.error('Please select at least one user');
        return;
      }

      // Use subtask API if it's a subtask, otherwise use task API
      if (isSubtask) {
        await updateSubtaskAssignedTo({
          id: taskId,
          assignedToId: selectedUsers.map(u => u.id),
          taskId: parentTaskId // 🔥 Pass parent taskId to refetch parent task
        }).unwrap();
        toast.success('Subtask assigned successfully');
      } else {
        await updateTaskAssignedTo({
          id: taskId,
          assignedToId: selectedUsers.map(u => u.id)
        }).unwrap();
        toast.success('Task assigned successfully');
      }
      onClose();
    } catch (error) {
      console.error('Failed to assign:', error);
      toast.error('Failed to assign. Please try again.');
    }
  };

  // Render user avatar
  const renderUserAvatar = (user: User, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    const initial = user.firstName?.charAt(0) || user.user?.email?.charAt(0) || '?';

    return (
      <div className={`${sizeClasses} rounded-full bg-blue-500 flex items-center justify-center text-white font-medium border-2 border-white overflow-hidden`}>
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={`${user.firstName || ''} ${user.lastName || ''}`}
            width={size === 'sm' ? 24 : 32}
            height={size === 'sm' ? 24 : 32}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="uppercase">{initial}</span>
        )}
      </div>
    );
  };

  return (
    <Popover
      open={isOpen}
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
      slotProps={{
        paper: {
          sx: {
            width: 400,
            maxHeight: 500,
            mt: 1,
          },
        },
      }}
    >
      <Paper elevation={3}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            Assign To
          </Typography>
          <IconButton onClick={onClose} size="small">
            <X size={16} />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <SearchInput
              placeholder="Search by email or name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                border: '1px solid #D1D5DB',
                borderRadius: 2,
                fontSize: '14px',
              }}
            />
          </Box>
        </Box>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Assigned To ({selectedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Box 
                  key={user.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    bgcolor: 'primary.50',
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {renderUserAvatar(user, 'sm')}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'Unknown User'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    onClick={() => clearSelection(user.id)} 
                    size="small" 
                    sx={{ color: 'error.main' }}
                  >
                    <X size={14} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* User List */}
        <Box sx={{ maxHeight: 256, overflowY: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No users found
              </Typography>
            </Box>
          ) : (
            <Box>
              {filteredUsers.map((user: User) => {
                const isSelected = isUserSelected(user.id);
                
                return (
                  <Box
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      borderLeft: 4,
                      borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected ? 'primary.50' : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.100' : 'action.hover',
                      },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {renderUserAvatar(user)}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          : 'Unknown User'
                        }
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.user?.email}
                      </Typography>
                      {user.role && (
                        <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                          {user.role.name}
                        </Typography>
                      )}
                    </Box>
                    {isSelected && (
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '4px',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 4,
                            height: 8,
                            borderRight: '2px solid white',
                            borderBottom: '2px solid white',
                            transform: 'rotate(45deg)',
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            onClick={handleApply}
            disabled={selectedUsers.length === 0}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Assign Task
          </Button>
        </Box>
      </Paper>
    </Popover>
  );
};

export default AssignedToSelector;
