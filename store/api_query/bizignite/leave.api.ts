import { BASEURL } from '@/store/baseUrl';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface LeaveTypeAllocation {
    leaveAttributes: [
        {
            id: string;
            year: number;
            leaveName: string;
            role: string[];
            allocatedDays: number;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
        }
    ]
}

export const LeaveApi = createApi({
    reducerPath: 'bizignite_leave_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as { auth?: { token?: string } };
            const token = state.auth?.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Accept", "application/json");
            return headers;
        },
    }),

    tagTypes: ['leaveAllocation', 'leave'],
    endpoints: (builder) => ({
        // create leave type allocation
        createLeaveTypeAllocation: builder.mutation<LeaveTypeAllocation, Record<string, LeaveTypeAllocation>>({
            query: (leaveTypeData) => ({
                url: 'leave-type-allocations',
                method: 'POST',
                body: leaveTypeData,
            }),
            invalidatesTags: ['leaveAllocation'],
        }),
        // get all leave type allocations
        getLeaveTypeAllocations: builder.query<any, Record<string, any> | undefined>({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();

                // Add all parameters including search, filters, pagination, etc.
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (Array.isArray(value)) {
                            // Handle array values (like multiple filters)
                            value.forEach(item => queryParams.append(key, String(item)));
                        } else {
                            queryParams.append(key, String(value));
                        }
                    }
                });

                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leave-type-allocations?${queryString}` : 'leave-type-allocations',
                    method: 'GET',
                };
            },
            providesTags: ['leaveAllocation'],
        }),
        getLeaveTypeNames: builder.query<string[], Record<string, any> | undefined>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leave-type-allocations/leaveType/names?${queryString}` : 'leave-type-allocations/leaveType/names',
                    method: 'GET',
                };
            },
            providesTags: ['leaveAllocation'],
        }),
        getUsersLeaveBalance: builder.query<string[], Record<string, any> | undefined>({
            query: (params) => {
                const queryParams = new URLSearchParams();

                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leave-type-allocations/user-leave-records/all?${queryString}` : 'leave-type-allocations/user-leave-records/all',
                    method: 'GET',
                };
            },
            providesTags: ['leaveAllocation'],
        }),
        getUserLeaveBalance: builder.query<void, { userID: string, params?: Record<string, any> }>({
            query: ({ userID, params }) => {
                const queryParams = new URLSearchParams();
                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leave-type-allocations/users/${userID}/leave-records?${queryString}` : `leave-type-allocations/users/${userID}/leave-records`,
                    method: 'GET',
                };
            },
            providesTags: ['leaveAllocation'],
        }),
        applyLeave: builder.mutation<void, FormData>({
            query: (formData) => ({
                url: 'leaves',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['leave'],
        }),
        userLeaveApplied: builder.query<void, { params?: Record<string, any>, companyUserId: string }>({
            query: ({ params, companyUserId }) => {
                const queryParams = new URLSearchParams();
                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leaves/user/${companyUserId}?${queryString}` : `leaves/user/${companyUserId}`,
                    method: 'GET',
                };
            },
            providesTags: ['leave'],
        }),
        getAllLeaves: builder.query<void, Record<string, any> | undefined>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leaves?${queryString}` : 'leaves',
                    method: 'GET',
                };
            },
            providesTags: ['leave'],
        }),
        changeLeaveStatus: builder.mutation<void, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `leaves/${id}/${status.toUpperCase() === 'APPROVED' ? 'approve' : 'changeLeaveStatus'}`,
                method: 'POST',
                body: { status },
            }),
            invalidatesTags: ['leave'],
        }),
        addCommentOnLeave: builder.mutation<any, Record<string, any>>({
            query: (commentsData) => ({
                url: 'leaves/comments',
                method: 'POST',
                body: commentsData,
            }),
            invalidatesTags: ['leave'],
        }),
        getAllComments: builder.query<any, { params?: Record<string, any>, leaveId: string | number }>({
            query: ({ params, leaveId }) => {
                const queryParams = new URLSearchParams();

                // Add filter parameters
                Object.entries(params || {}).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });

                const queryString = queryParams.toString();
                return {
                    url: queryString ? `leaves/comments/${leaveId}?${queryString}` : `leaves/comments/${leaveId}`,
                    method: 'GET',
                };
            },
            providesTags: (result, error, { leaveId }) =>
                result ? [{ type: 'leave' as const, id: leaveId }, 'leave'] : ['leave'],
        }),
        getAllLeavesNameOnly: builder.query<
            { data: { id: string; leaveName: string }[] }, 
            Record<string, any> | undefined                
        >({
            query: (params) => {
                const queryParams = new URLSearchParams();
                const queryString = queryParams.toString();
                return {
                    url: queryString
                        ? `leave-type-allocations/leaveType/leaveNameOnly?${queryString}`
                        : 'leave-type-allocations/leaveType/leaveNameOnly',
                    method: 'GET',
                };
            },
            providesTags: ['leave'],
        }),
    }),
});

export const { 
    useCreateLeaveTypeAllocationMutation, 
    useAddCommentOnLeaveMutation, 
    useGetAllCommentsQuery, 
    useGetLeaveTypeAllocationsQuery, 
    useGetLeaveTypeNamesQuery, 
    useGetUsersLeaveBalanceQuery, 
    useApplyLeaveMutation, 
    useUserLeaveAppliedQuery, 
    useGetAllLeavesQuery, 
    useChangeLeaveStatusMutation, 
    useGetUserLeaveBalanceQuery,
    useGetAllLeavesNameOnlyQuery 
} = LeaveApi;