// src/store/api_query/BizAccelerator/activities.api.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

export interface BizActivity {
  id: string;
  recordId: string;
  type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE' | 'TASK';
  title: string;
  description?: string;
  scheduledAt?: string;
  completedAt?: string;
  status: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  dealId?: string;
  clientId?: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateActivityData {
  type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE' | 'TASK';
  title: string;
  description?: string;
  scheduledAt?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  dealId?: string;
  clientId?: string;
  assignedToId?: string;
  status?: string;
  documents?: string[];
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  contactId?: string;
  leadId?: string;
  opportunityId?: string;
  dealId?: string;
  clientId?: string;
  assignedToId?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
}

export const bizActivitiesApi = createApi({
  reducerPath: 'bizActivitiesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
  }),
  tagTypes: ['BizActivity'],
  endpoints: (builder) => ({
    // Get activities with filters
    getActivities: builder.query<unknown, ActivityFilters>({
      query: (filters) => ({
        url: '/activities',
        params: filters,
      }),
      providesTags: ['BizActivity'],
      keepUnusedDataFor: 600,
    }),

    // Get activities by entity (contact, lead, etc.)
    getActivitiesByEntity: builder.query<{ data?: { items?: unknown[] } } | { items?: unknown[] }, { entityType: string; entityId: string }>({
      query: ({ entityType, entityId }) => ({
        url: `/activities/entity/${entityType}/${entityId}`,
      }),
      providesTags: ['BizActivity'],
      keepUnusedDataFor: 600,
    }),

    // Get single activity
    getActivity: builder.query<unknown, string>({
      query: (id) => `/activities/${id}`,
      providesTags: (result, error, id) => [{ type: 'BizActivity', id }],
      keepUnusedDataFor: 600,
    }),

    // Create activity
    createActivity: builder.mutation<unknown, CreateActivityData>({
      query: (data) => ({
        url: '/activities',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['BizActivity'],
    }),

    // Update activity
    updateActivity: builder.mutation<unknown, { activityId: string; data: Partial<CreateActivityData> }>({
      query: ({ activityId, data }) => ({
        url: `/activities/${activityId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { activityId }) => [
        { type: 'BizActivity', id: activityId },
        'BizActivity',
      ],
    }),

    // Delete activity
    deleteActivity: builder.mutation<void, string>({
      query: (activityId) => ({
        url: `/activities/${activityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BizActivity'],
    }),

    // Bulk create activities
    bulkCreateActivities: builder.mutation<unknown, CreateActivityData[]>({
      query: (activities) => ({
        url: '/activities/bulk/create',
        method: 'POST',
        body: activities,
      }),
      invalidatesTags: ['BizActivity'],
    }),

    // update activity
    createActivityUpdate: builder.mutation<unknown, { activityId: string; content: string }>({
      query: ({ activityId, content }) => ({
        url: `activities/${activityId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['BizActivity'],
    }),
    getActivityUpdates: builder.query<unknown, string>({
      query: (activityId) => ({ url: `activities/${activityId}/updates`, method: 'GET' }),
      providesTags: (result, error, activityId) => [
        { type: 'BizActivity', id: activityId }
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),
    editActivityUpdate: builder.mutation<unknown, { activityId: string; updateId: string; content: string }>({
      query: ({ activityId, updateId, content }) => ({
        url: `activities/${activityId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { activityId }) => [
        { type: 'BizActivity' as const, id: activityId }
      ],
    }),

  }),
});

export const {
  useGetActivitiesQuery,
  useGetActivitiesByEntityQuery,
  useGetActivityQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
  useBulkCreateActivitiesMutation,
  useCreateActivityUpdateMutation,
  useGetActivityUpdatesQuery,
  useEditActivityUpdateMutation,
} = bizActivitiesApi;