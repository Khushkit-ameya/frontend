"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Search, X } from 'lucide-react';
import { useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import { useUpdateProjectManagerMutation } from '@/store/api_query/LazyKill/project.api';
import { Popover, Paper, Typography, Box, InputBase, Button, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

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

interface ManagerSelectorProps {
  projectId: string;
  currentManagers: User[];
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

const SearchInput = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: '8px 12px',
    paddingLeft: '40px',
  },
}));

const ManagerSelector: React.FC<ManagerSelectorProps> = ({
  projectId,
  currentManagers = [],
  isOpen,
  onClose,
  anchorEl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Fetch all users and managers
  const { data: managersData } = useGetCompanyUsersQuery({ role: 'Manager' });

  const [updateProjectManager] = useUpdateProjectManagerMutation();

  // Initialize selected users from current managers
  useEffect(() => {
    if (currentManagers?.length > 0) {
      setSelectedUsers(currentManagers);
    }
  }, [currentManagers]);

  // Combine all users and managers with proper typing
  const allUsers: User[] = (managersData?.users || []) as User[];

  // Remove duplicates by id
  const uniqueUsers = allUsers.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );

  // Filter users based on search term
  const filteredUsers = uniqueUsers.filter(user => {
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

  // Toggle user selection
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Remove selected user
  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  // Apply selection (update project managers)
  const handleApply = async () => {
    try {
      const managerIds = selectedUsers.map(user => user.id);
      
      if (managerIds.length === 0) {
        toast.error('Please select at least one manager');
        return;
      }

      await updateProjectManager({
        id: projectId,
        managers: managerIds
      }).unwrap();

      toast.success('Project managers updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update project managers:', error);
      toast.error('Failed to update project managers. Please try again.');
    }
  };

  // Render user avatar
  const renderUserAvatar = (user: User, size: 'sm' | 'md' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
    const initial = user.firstName?.charAt(0) || user.user?.email?.charAt(0) || '?';

    return (
      <div className={`${sizeClasses} rounded-full bg-green-500 flex items-center justify-center text-white font-medium border-2 border-white overflow-hidden`}>
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
            Add Member
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

        {/* Selected Members */}
        {selectedUsers.length > 0 && (
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
              Members
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {renderUserAvatar(user, 'sm')}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.firstName || user.lastName 
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : 'Unknown User'
                          }
                        </Typography>
                        <Box component="span" sx={{ px: 0.5, py: 0.25, bgcolor: 'primary.50', color: 'primary.600', borderRadius: 0.5, fontSize: '10px' }}>
                          You
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {user.user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {user.role?.name === 'Manager' ? '2 teams' : '1 team'}
                    </Typography>
                    <IconButton onClick={() => removeSelectedUser(user.id)} size="small" sx={{ color: 'error.main' }}>
                      <X size={14} />
                    </IconButton>
                  </Box>
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
              {filteredUsers.map((user) => {
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
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'white',
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
            Update Manager
          </Button>
        </Box>
      </Paper>
    </Popover>
  );
};

export default ManagerSelector;