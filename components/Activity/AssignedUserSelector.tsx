'use client';
import React, { useState, useEffect } from 'react';
import {
  Popover,
  Paper,
  Typography,
  Button,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useGetCurrentUserQuery, useGetCompanyUsersQuery } from '@/store/api_query/auth.api';
import { useUpdateActivityMutation } from '@/store/api_query/LazyKill/activities.api';
import { customToast as toast } from '@/utils/toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  email?: string;
}

interface CompanyUsersResponse {
  users: User[];
}

interface AssignedUserSelectorProps {
  activityId: string;
  currentAssignedUser?: User;
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export default function AssignedUserSelector({
  activityId,
  currentAssignedUser,
  isOpen,
  onClose,
  anchorEl
}: AssignedUserSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | undefined>(currentAssignedUser);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: currentUser } = useGetCurrentUserQuery();
  const { data: companyUsersResponse, isLoading: isLoadingUsers } = useGetCompanyUsersQuery({});
  const [updateActivity] = useUpdateActivityMutation();

  // Extract users array from API response
  const companyUsers = (companyUsersResponse as CompanyUsersResponse)?.users || [];

  // Filter users based on search term
  const filteredUsers = companyUsers.filter((user: User) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update selected user when current user changes
  useEffect(() => {
    setSelectedUser(currentAssignedUser);
  }, [currentAssignedUser]);

  const handleUserSelect = async (user: User) => {
    if (!activityId) return;

    setIsUpdating(true);
    try {
      await updateActivity({
        id: activityId,
        updateData: {
          assignedToId: user.id
        }
      }).unwrap();

      setSelectedUser(user);
      toast.success(`Activity assigned to ${user.firstName} ${user.lastName}`);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to update assigned user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update assigned user';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnassign = async () => {
    if (!activityId || !currentUser?.id) return;

    setIsUpdating(true);
    try {
      // Assign to current user as fallback
      await updateActivity({
        id: activityId,
        updateData: {
          assignedToId: currentUser.id
        }
      }).unwrap();

      setSelectedUser(undefined);
      toast.success('Activity unassigned');
      onClose();
    } catch (error: unknown) {
      console.error('Failed to unassign user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to unassign user';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserDisplayName = (user?: { firstName: string; lastName: string; email?: string }) => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`;
  };

  const getUserInitials = (user?: { firstName: string; lastName: string }) => {
    if (!user) return '';

    // Safely handle potentially missing names
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    return `${firstName} ${lastName}`.trim() || 'Unknown User';
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
      PaperProps={{
        sx: {
          width: '320px',
          maxHeight: '400px'
        }
      }}
    >
      <Paper sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" />
              Assign User
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Current Assignment */}
          {currentAssignedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Currently assigned to:
              </Typography>
              <Chip
                avatar={
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                    {currentAssignedUser.avatar ? (
                      <img
                        src={currentAssignedUser.avatar}
                        alt={getUserDisplayName(currentAssignedUser)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getUserInitials(currentAssignedUser)
                    )}
                  </Avatar>
                }
                label={getUserDisplayName(currentAssignedUser)}
                onDelete={handleUnassign}
                disabled={isUpdating}
                sx={{ mt: 0.5 }}
              />
            </Box>
          )}
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </Box>

        {/* User List */}
        <Box sx={{ maxHeight: '240px', overflow: 'auto' }}>
          {(isUpdating || isLoadingUsers) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {!isUpdating && !isLoadingUsers && filteredUsers.length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No users found
              </Typography>
            </Box>
          )}

          {!isUpdating && !isLoadingUsers && filteredUsers.length > 0 && (
            <List sx={{ p: 0 }}>
              {filteredUsers.map((user: User) => (
                <ListItem
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedUser?.id === user.id ? 'primary.light' : 'transparent',
                    '&:hover': {
                      backgroundColor: selectedUser?.id === user.id ? 'primary.main' : 'action.hover'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 20, height: 20 }}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={getUserDisplayName(user)}
                          style={{ width: '20px', height: '20px' }}
                        />
                      ) : (
                        getUserInitials(user)
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={getUserDisplayName(user)}
                    secondary={user.email}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Select a user to assign this activity to them
          </Typography>
        </Box>
      </Paper>
    </Popover>
  );
}