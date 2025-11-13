// attendance.api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

// Interfaces based on your actual API response
export interface PunchLocation {
  address: string;
  latitude: string;
  longitude: string;
}

export interface UserPunch {
  id: string;
  attendanceId: string;
  punchIn: string;
  punchInLocation: PunchLocation;
  punchOut: string;
  punchOutLocation: PunchLocation | null;
  workHours: number | null;
  overtime: number | null;
  status: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
  remarks: string | null;
  punchType: 'IN' | 'OUT';
  deviceId: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  userId: string;
  companyUserId: string;
  punchDate: string;
  totalWorkHours: number | null;
  totalOvertime: number | null;
  finalStatus: string;
  createdAt: string;
  updatedAt: string;
  userPunches: UserPunch[];
  user?: {
    email?: string;
  };
  companyUser?: {
    firstName?: string;
    lastName?: string;
    role?: string | null;
  };
  shift?: {
    id?: string;
    name?: string;
    startTime?: string;
    endTime?: string;
  };
}



export interface PunchInRequest {
  punchInLocation: PunchLocation;
  deviceId: string;
  ipAddress: string;
  remarks?: string;
}

export interface PunchOutRequest {
  punchOutLocation: PunchLocation;
  deviceId: string;
  ipAddress: string;
  remarks?: string;
}

export interface AttendanceSummary {
  userId: string;
  companyId: string;
  month: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  totalWorkHours: number;
  totalOvertime: number;
}

export interface UpdateAttendanceRequest {
  status?: 'PRESENT' | 'HALF_DAY' | 'ABSENT';
  workHours?: number;
  overtime?: number;
  remarks?: string;
}

// Filter interfaces
export interface AttendanceFilter {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  search?:string;
  sortField?:string;
  direction?:string;
  filters?:any;
}

export interface UserAttendanceFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface SummaryFilter {
  userId: string;
  companyId: string;
  month?: string;
}

// API response interfaces
export interface ApiResponse<T> {
  message: string;
  data: T;
  meta?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Specific response types
export type AttendanceResponse = ApiResponse<AttendanceRecord>;
export type AttendancesListResponse = ApiResponse<PaginatedResponse<AttendanceRecord>>;
export type UserAttendancesResponse = ApiResponse<AttendanceRecord[]>;
export type AttendanceSummaryResponse = ApiResponse<AttendanceSummary>;
export type DeleteAttendanceResponse = ApiResponse<{ id: string }>;

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    companyId?: string;
    companyUserId?: string;
  };
}

export type LoginApiResponse = ApiResponse<LoginResponse>;

export const Api_Attendance = createApi({
  reducerPath: "Api_Attendance",
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: "include",
    prepareHeaders: (headers) => {
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
  tagTypes: [
    "Attendance", 
    "Attendances", 
    "UserAttendance", 
    "AttendanceSummary", 
    "Auth"
  ],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginApiResponse, LoginRequest>({
      query: (credentials: LoginRequest) => ({
        url: `/auth/login`,
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Punch Operations endpoints
    punchIn: builder.mutation<AttendanceResponse, PunchInRequest>({
      query: (punchInData: PunchInRequest) => ({
        url: `/attendance/punch-in`,
        method: "POST",
        body: punchInData,
      }),
      invalidatesTags: ["UserAttendance", "AttendanceSummary"],
    }),

    punchOut: builder.mutation<AttendanceResponse, PunchOutRequest>({
      query: (punchOutData: PunchOutRequest) => ({
        url: `/attendance/punch-out`,
        method: "POST",
        body: punchOutData,
      }),
      invalidatesTags: ["UserAttendance", "AttendanceSummary"],
    }),

    // Attendance Queries endpoints
getAllAttendances: builder.query<AttendancesListResponse, AttendanceFilter | void>({
  query: (params) => {
    const queryParams = new URLSearchParams();

    // Safely serialize params
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          // JSON stringify only for objects or arrays
          queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }

    return {
      url: `/attendance${queryParams.size ? `?${queryParams.toString()}` : ''}`,
      method: 'GET',
    };
  },
  providesTags: ['Attendances'],
}),

    getUserAttendance: builder.query<UserAttendancesResponse, { date: string }>({
      query: (params: { date: string }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('date', params.date);

        return {
          url: `/attendance/user?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["UserAttendance"],
    }),

    getUserAttendanceRange: builder.query<UserAttendancesResponse, {
      startDate: string;
      endDate: string;
    }>({
      query: (params: { startDate: string; endDate: string }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('startDate', params.startDate);
        queryParams.append('endDate', params.endDate);

        return {
          url: `/attendance/user?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["UserAttendance"],
    }),

    // Attendance Summary endpoints
    getUserAttendanceSummary: builder.query<AttendanceSummaryResponse, SummaryFilter>({
      query: (params: SummaryFilter) => {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });

        return {
          url: `/attendance/summary?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["AttendanceSummary"],
    }),

    // Attendance Management endpoints
    getAttendanceById: builder.query<AttendanceResponse, string>({
      query: (id: string) => ({
        url: `/attendance/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Attendance", id }],
    }),

    updateAttendance: builder.mutation<AttendanceResponse, {
      id: string;
      updateData: UpdateAttendanceRequest;
    }>({
      query: ({ id, updateData }) => ({
        url: `/attendance/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Attendances",
        "UserAttendance",
        "AttendanceSummary",
        { type: "Attendance", id },
      ],
    }),

    deleteAttendance: builder.mutation<DeleteAttendanceResponse, string>({
      query: (id: string) => ({
        url: `/attendance/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Attendances", "UserAttendance", "AttendanceSummary"],
    }),
  }),
});

export const {
  // Authentication
  // useLoginMutation,

  // Punch Operations
  usePunchInMutation,
  usePunchOutMutation,

  // Attendance Queries
  useGetAllAttendancesQuery,
  useGetUserAttendanceQuery,
  useGetUserAttendanceRangeQuery,

  // Attendance Summary
  useGetUserAttendanceSummaryQuery,

  // Attendance Management
  useGetAttendanceByIdQuery,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
} = Api_Attendance;

export default Api_Attendance;