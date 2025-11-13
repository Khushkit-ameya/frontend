import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

// Activity type enumeration based on backend
export type ActivityType = 'meeting' | 'call' | 'notes' | 'toDo' | 'email';

// Activity status interface
export interface ActivityStatus {
    statusName: string;
    color: string;
}

// Activity interface based on backend API
export interface Activity {
    id: string;
    scheduleTimeFrom: string;
    scheduleTimeTo: string;
    title: string;
    description?: string;
    documents?: string[];
    type: ActivityType;
    status: ActivityStatus;
    projectId?: string;
    taskId?: string;
    subTaskId?: string;
    assignedToId: string;
    createdById: string;
    companyId: string;
    createdAt: string;
    updatedAt: string;
    // Populated relations
    assignedTo?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    createdBy?: {
        id: string;
        firstName: string;
        lastName: string;
        avatar?: string;
    };
    project?: {
        id: string;
        name: string;
        projectId: string;
    };
    company?: {
        id: string;
        name: string;
    };
}

// Create activity DTO
export interface CreateActivityDto {
    scheduleTimeFrom: string;
    scheduleTimeTo: string;
    title: string;
    description?: string;
    documents?: string[];
    type: ActivityType;
    status?: ActivityStatus;
    projectId?: string;
    taskId?: string;
    subTaskId?: string;
    assignedToId: string;
    companyId: string;
}

// Update activity DTO
export interface UpdateActivityDto {
    scheduleTimeFrom?: string;
    scheduleTimeTo?: string;
    title?: string;
    description?: string;
    documents?: string[];
    type?: ActivityType;
    status?: ActivityStatus;
    projectId?: string;
    taskId?: string;
    subTaskId?: string;
    assignedToId?: string;
}

// API response interfaces
export interface ActivitiesResponse {
    activities: Activity[];
    total: number;
}

export interface ActivityResponse {
    success: boolean;
    message: string;
    data: Activity;
}

export interface ActivitiesListResponse {
    success: boolean;
    message: string;
    data: ActivitiesResponse;
}

// Query parameters for fetching activities
export interface ActivitiesQueryParams {
    page?: number;
    countPerPage?: number;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    // Filter parameters (using operator:value format)
    title?: string;
    description?: string;
    type?: string;
    'status.statusName'?: string;
    assignedToId?: string;
    projectId?: string;
    scheduleTimeFrom?: string;
    scheduleTimeTo?: string;
    createdAt?: string;
    [key: string]: unknown; // Allow additional filter parameters
}

export const activitiesApi = createApi({
    reducerPath: "activitiesApi",
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as { auth?: { token?: string } }).auth?.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ["Activities", "Activity"],
    endpoints: (builder) => ({
        // Get all activities with filters and pagination
        getAllActivities: builder.query<ActivitiesListResponse, ActivitiesQueryParams>({
            query: (params: ActivitiesQueryParams = {}) => {
                const queryParams = new URLSearchParams();
                
                // Add pagination parameters
                if (params.page) queryParams.append('page', params.page.toString());
                if (params.countPerPage) queryParams.append('countPerPage', params.countPerPage.toString());
                
                // Add sorting parameters
                if (params.sort) queryParams.append('sort', params.sort);
                if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
                
                // Add filter parameters (exclude pagination and sort params)
                Object.entries(params).forEach(([key, value]) => {
                    if (!['page', 'countPerPage', 'sort', 'sortDirection'].includes(key) && value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                
                return {
                    url: `/api/lazy-kill/activities?${queryParams.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Activities"],
        }),
        getAllActivitiesIn: builder.query<ActivitiesListResponse, ActivitiesQueryParams>({
            query: (params: ActivitiesQueryParams = {}) => {
                const queryParams = new URLSearchParams();
                
                // Add pagination parameters
                if (params.page) queryParams.append('page', params.page.toString());
                if (params.countPerPage) queryParams.append('countPerPage', params.countPerPage.toString());
                
                // Add sorting parameters
                if (params.sort) queryParams.append('sort', params.sort);
                if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);
                
                // Add filter parameters (exclude pagination and sort params)
                Object.entries(params).forEach(([key, value]) => {
                    if (!['page', 'countPerPage', 'sort', 'sortDirection'].includes(key) && value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                
                return {
                    url: `/api/lazy-kill/activities/in-activities?${queryParams.toString()}`,
                    method: "GET",
                };
            },
            providesTags: ["Activities"],
        }),

        // Get activity by ID
        getActivityById: builder.query<ActivityResponse, string>({
            query: (id: string) => ({
                url: `/api/lazy-kill/activities/${id}`,
                method: "GET",
            }),
            providesTags: (_result, _error, id) => [{ type: "Activity", id }],
        }),

        // Create new activity
        createActivity: builder.mutation<ActivityResponse, CreateActivityDto>({
            query: (createData: CreateActivityDto) => ({
                url: `/api/lazy-kill/activities`,
                method: "POST",
                body: createData,
            }),
            invalidatesTags: ["Activities"],
        }),

        // Update activity
        updateActivity: builder.mutation<ActivityResponse, { id: string; updateData: UpdateActivityDto }>({
            query: ({ id, updateData }: { id: string; updateData: UpdateActivityDto }) => ({
                url: `/api/lazy-kill/activities/${id}`,
                method: "PATCH",
                body: updateData,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                "Activities",
                { type: "Activity", id },
            ],
        }),

        // Update activity status only
        updateActivityStatus: builder.mutation<ActivityResponse, { id: string; status: ActivityStatus }>({
            query: ({ id, status }: { id: string; status: ActivityStatus }) => ({
                url: `/api/lazy-kill/activities/${id}/status`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                "Activities",
                { type: "Activity", id },
            ],
        }),

        // Update activity status only (optimized endpoint)
        updateActivityStatusOnly: builder.mutation<ActivityResponse, { id: string; status: ActivityStatus }>({
            query: ({ id, status }: { id: string; status: ActivityStatus }) => ({
                url: `/api/lazy-kill/activities/${id}/status-only`,
                method: "PATCH",
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                "Activities",
                { type: "Activity", id },
            ],
        }),

        // Delete activity
        deleteActivity: builder.mutation<ActivityResponse, string>({
            query: (id: string) => ({
                url: `/api/lazy-kill/activities/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Activities"],
        }),
    }),
});

export const {
    useGetAllActivitiesQuery,
    useGetActivityByIdQuery,
    useCreateActivityMutation,
    useUpdateActivityMutation,
    useUpdateActivityStatusMutation,
    useUpdateActivityStatusOnlyMutation,
    useDeleteActivityMutation,
    useGetAllActivitiesInQuery,
} = activitiesApi;