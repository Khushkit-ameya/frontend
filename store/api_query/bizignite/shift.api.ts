import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

// Shift interfaces based on your backend API
export interface ShiftFormData {
  id?: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  gracePeriodMinutes: number;
}

export interface ShiftAttribute {
  id: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration: number | null;
  gracePeriodMinutes: number | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignments: ShiftAttributeAssignment[];
}

export interface ShiftAttributeAssignment {
  id: string;
  shiftAttributeId: string;
  assignedUserId: string;
  assignedAt: string;
  assignedUser: {
    id: string;
    user: {
      id: string;
      email: string;
    };
    role?: {
      id: string;
      name: string;
    };
  };
}

export interface Shift {
  id: string;
  companyId: string;
  shiftCreatedBy: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    user: {
      id: string;
      email: string;
    };
  };
  shiftAttributes: ShiftAttribute[];
}

export interface UserShift {
  id: string;
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakDuration: number | null;
  gracePeriodMinutes: number | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shift: {
    id: string;
    companyId: string;
    shiftCreatedBy: string;
    createdAt: string;
    updatedAt: string;
    company: {
      id: string;
      name: string;
    };
    createdBy: {
      id: string;
      user: {
        id: string;
        email: string;
      };
    };
  };
  assignments: ShiftAttributeAssignment[];
}

// Create shift DTO 
export interface CreateShiftDto {
  shiftAttributes: {
    shiftName: string;
    startTime: string;
    endTime: string;
    breakDuration?: string; 
    gracePeriodMinutes?: string; 
    description?: string;
    color?: string;
    assignedUserIds?: string[]; 
  }[];
}

// Update shift DTO 
export interface UpdateShiftDto {
  shiftAttributes: {
    id?: string;
    shiftName?: string;
    startTime?: string;
    endTime?: string;
    breakDuration?: string; 
    gracePeriodMinutes?: string; 
    description?: string;
    color?: string;
    isActive?: boolean;
  }[];
}

// Assign shift DTO
export interface AssignShiftDto {
  shiftAttributeId: string;
  assignedUserIds: string[];
  removeUserIds?: string[]; 
}

// Update shift attribute DTO 
export interface UpdateShiftAttributeDto {
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  gracePeriodMinutes?: number;
  description?: string;
  color?: string;
  isActive?: boolean;
}

// Filter shift DTO 
export interface FilterShiftDto {
  shiftName?: string;
  startDateFrom?: string;
  startDateTo?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  isActive?: boolean;
}

// API response interfaces
export interface ApiResponse<T> {
  message: string;
  data: T;
  meta?: any;
}

export type ShiftResponse = ApiResponse<Shift>;
export type ShiftsListResponse = ApiResponse<Shift[]>;
export type UserShiftsResponse = ApiResponse<UserShift[]>;
export type ShiftAttributeResponse = ApiResponse<ShiftAttribute>;
export type ShiftAssignmentResponse = ApiResponse<{
  id: string;
  shiftName: string;
  assignments: ShiftAttributeAssignment[];
  meta?: {
    assignmentsCreated: number;
    totalAssignedUsers: number;
    validUsers: Array<{ id: string; email: string }>;
    invalidUsers: Array<{ id: string; email: string }>;
    warning: string | null;
  };
}>;

export type DeleteAssignmentResponse = ApiResponse<{
  removedAssignmentId: string;
  removedUserId: string;
  remainingAssignedUserIds: string[];
  shiftAttributeId: string;
}>;

// Users without shifts interfaces
export interface UserWithoutShift {
  id: string;
  userId: string;
  companyId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export interface UsersWithoutShiftsResponse extends ApiResponse<UserWithoutShift[]> {
  meta: {
    totalCount: number;
    activeUsers: number;
    pendingUsers: number;
    usersWithRole: number;
    usersWithoutRole: number;
    note?: string;
  };
}

export const shiftApi = createApi({
  reducerPath: "shiftApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: "include",
    prepareHeaders: (headers) => {
      // Only include Authorization header, remove custom headers
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            headers.set('authorization', `Bearer ${token}`);
          }
        } catch (error) {
          console.warn('Error setting headers from localStorage:', error);
        }
      }

      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ["Shifts", "Shift", "ShiftAttributes", "UserShifts", "UsersWithoutShifts"],
  endpoints: (builder) => ({
    // Get all shifts with filters 
    getAllShifts: builder.query<ShiftsListResponse, FilterShiftDto | void>({
      query: (params?: FilterShiftDto) => {
        const queryParams = new URLSearchParams();
        // Add filter parameters if provided
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              queryParams.append(key, String(value));
            }
          });
        }

        const queryString = queryParams.toString();
        return {
          url: `/shifts${queryString ? `?${queryString}` : ''}`,
          method: "GET",
        };
      },
      providesTags: ["Shifts"],
    }),

    // Get shift by ID 
    getShiftById: builder.query<ShiftResponse, string>({
      query: (id: string) => ({
        url: `/shifts/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Shift", id }],
    }),

    // Create new shift 
    createShift: builder.mutation<ShiftResponse, CreateShiftDto>({
      query: (createData: CreateShiftDto) => ({
        url: `/shifts`,
        method: "POST",
        body: createData,
      }),
      invalidatesTags: ["Shifts", "UsersWithoutShifts"],
    }),

    // Update shift
    updateShift: builder.mutation<ShiftResponse, { id: string; updateData: UpdateShiftDto }>({
      query: ({ id, updateData }) => ({
        url: `/shifts/${id}`,
        method: "PATCH",
        body: updateData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Shifts",
        { type: "Shift", id },
      ],
    }),

    // Delete shift 
    deleteShift: builder.mutation<{ message: string }, string>({
      query: (id: string) => ({
        url: `/shifts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shifts", "UsersWithoutShifts"],
    }),

    // Assign users to shift attribute 
    assignShift: builder.mutation<ShiftAssignmentResponse, AssignShiftDto>({
      query: (assignData: AssignShiftDto) => ({
        url: `/shifts/assign`,
        method: "POST",
        body: assignData,
      }),
      invalidatesTags: ["ShiftAttributes", "Shifts", "UsersWithoutShifts"],
    }),

    // Update shift attribute 
    updateShiftAttribute: builder.mutation<ShiftAttributeResponse, {
      shiftAttributeId: string;
      updateData: UpdateShiftAttributeDto
    }>({
      query: ({ shiftAttributeId, updateData }) => ({
        url: `/shifts/attribute/${shiftAttributeId}`,
        method: "PATCH",
        body: updateData,
      }),
      invalidatesTags: ["ShiftAttributes", "Shifts"],
    }),

    // Delete shift attribute 
    deleteShiftAttribute: builder.mutation<{ message: string }, string>({
      query: (id: string) => ({
        url: `/shifts/attribute/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shifts", "UsersWithoutShifts"],
    }),

    // Delete shift assignment 
    deleteShiftAssignment: builder.mutation<DeleteAssignmentResponse, string>({
      query: (id: string) => ({
        url: `/shifts/assignment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shifts", "UsersWithoutShifts"],
    }),

    // Get user shifts 
    getUserShifts: builder.query<UserShiftsResponse, void>({
      query: () => ({
        url: `/shifts/userShifts/me`,
        method: "GET",
      }),
      providesTags: ["UserShifts"],
    }),

    // Get users without shifts 
    getUsersWithoutShifts: builder.query<UsersWithoutShiftsResponse, void>({
      query: () => ({
        url: `/shifts/users/without-shifts`,
        method: "GET",
      }),
      providesTags: ["UsersWithoutShifts"],
    }),
  }),
});

export const {
  useGetAllShiftsQuery,
  useGetShiftByIdQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useAssignShiftMutation,
  useUpdateShiftAttributeMutation,
  useDeleteShiftAttributeMutation,
  useDeleteShiftAssignmentMutation,
  useGetUserShiftsQuery,
  useGetUsersWithoutShiftsQuery,
} = shiftApi;