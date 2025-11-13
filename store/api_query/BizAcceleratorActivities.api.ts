import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type ActivityListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  entityType?: 'contact' | 'lead' | 'opportunity' | 'deal' | 'client';
  entityId?: string;
  viewName?: string;
  [key: string]: unknown;
};

const ActivitiesApi = createApi({
  reducerPath: 'activities_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['activities', 'activity_fields'],
  endpoints: (builder) => ({
    getActivityFields: builder.query<unknown, void>({
      query: () => ({ url: 'activities/fields', method: 'GET' }),
      providesTags: ['activity_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),
    getActivities: builder.query<unknown, ActivityListQuery | void>({
      query: (params) => ({ url: 'activities', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['activities'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    updateActivity: builder.mutation<unknown, { activityId: string; data: Record<string, unknown> }>({
      query: ({ activityId, data }) => ({ url: `activities/${activityId}`, method: 'PUT', body: data }),
      invalidatesTags: ['activities'],
    }),
    updateActivityField: builder.mutation<unknown, { fieldId: string; data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }>({
      query: ({ fieldId, data }) => ({ url: `activities/fields/${fieldId}`, method: 'PUT', body: data }),
      invalidatesTags: ['activity_fields'],
    }),
    reorderActivityFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
      query: ({ fieldOrders }) => ({ url: `activities/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['activity_fields'],
    }),
  }),
});

export const {
  useGetActivityFieldsQuery,
  useGetActivitiesQuery,
  useUpdateActivityMutation,
  useUpdateActivityFieldMutation,
  useReorderActivityFieldsMutation,
} = ActivitiesApi;
export default ActivitiesApi;
