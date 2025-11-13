import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type LeadListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  includeConverted?: boolean;
  viewName?: string;
  // NEW: Filter support
  filters?: Array<{
    fieldKey: string;
    condition: string;
    value: unknown;
    values?: unknown[];
  }>;
  filterGroup?: {
    logic: 'AND' | 'OR';
    rules: Array<Record<string, unknown>>;
  };
  savedFilterId?: string;
  [key: string]: unknown;
};

const LeadsApi = createApi({
  reducerPath: 'leads_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['leads', 'lead_fields'],
  endpoints: (builder) => ({
    getLeadFields: builder.query<unknown, void>({
      query: () => ({ url: 'leads/fields', method: 'GET' }),
      providesTags: ['lead_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),
    getLeads: builder.query<unknown, LeadListQuery | void>({
      query: (params) => ({ url: 'leads', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['leads'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    filterLeads: builder.mutation<unknown, {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
      includeConverted?: boolean;
      filters?: Array<{
        fieldKey: string;
        condition: string;
        value: unknown;
        values?: unknown[];
      }>;
      filterGroup?: {
        logic: 'AND' | 'OR';
        rules: Array<Record<string, unknown>>;
      };
      entityType?: string;
    }>({
      query: (body) => ({
        url: 'leads/filter',
        method: 'POST',
        body: {
          entityType: 'lead',
          ...body
        }
      }),
      invalidatesTags: ['leads'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    updateLead: builder.mutation<unknown, { leadId: string; data: Record<string, unknown> }>(
      {
        query: ({ leadId, data }) => ({ url: `leads/${leadId}`, method: 'PUT', body: data }),
        invalidatesTags: ['leads'],
      }
    ),
    updateLeadField: builder.mutation<unknown, { fieldId: string; data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }>(
      {
        query: ({ fieldId, data }) => ({ url: `leads/fields/${fieldId}`, method: 'PUT', body: data }),
        invalidatesTags: ['lead_fields'],
      }
    ),
    reorderLeadFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>(
      {
        query: ({ fieldOrders }) => ({ url: `leads/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
        invalidatesTags: ['lead_fields'],
      }
    ),
    // NEW: Convert lead to opportunity
    convertToOpportunity: builder.mutation<unknown, { leadId: string; opportunityData?: Record<string, unknown> }>(
      {
        query: ({ leadId, opportunityData = {} }) => ({
          url: `leads/${leadId}/convert-to-opportunity`,
          method: 'POST',
          body: opportunityData
        }),
        invalidatesTags: ['leads'],
        transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      }
    ),
    getFieldStages: builder.query({
      query: ({ fieldId, includeInactive = false }: { fieldId: string; includeInactive?: boolean }) =>
        `/field-definitions/${fieldId}/stages?includeInactive=${includeInactive}`,
      providesTags: ['leads'],
    }),
    getLead: builder.query({
      query: (leadId: string) => `/leads/${leadId}`,
      providesTags: ['leads'],
      keepUnusedDataFor: 600,
    }),
    createLead: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({
        url: 'leads',
        method: 'POST',
        body: data, // Send data directly, not wrapped
      }),
      invalidatesTags: ['leads'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    addLeadUpdate: builder.mutation<unknown, { leadId: string; content: string }>({
      query: ({ leadId, content }) => ({
        url: `leads/${leadId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['leads'],
    }),
    getLeadUpdates: builder.query<unknown, string>({
      query: (leadId) => ({ url: `leads/${leadId}/updates`, method: 'GET' }),
      providesTags: (result, error, leadId) => [
        { type: 'leads', id: leadId },
        { type: 'leads', id: 'LIST' },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),
    editLeadUpdate: builder.mutation<unknown, { leadId: string; updateId: string; content: string }>({
      query: ({ leadId, updateId, content }) => ({
        url: `leads/${leadId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { leadId }) => [
        { type: 'leads' as const, id: leadId },
        { type: 'leads' as const, id: 'LIST' },
      ],
    }),

    // Delete lead
    deleteLead: builder.mutation<void, string>({
      query: (leadId) => ({ url: `leads/${leadId}`, method: 'DELETE' }),
      invalidatesTags: ['leads'],
    }),
  }),
});

export const {
  useGetLeadFieldsQuery,
  useGetLeadsQuery,
  useUpdateLeadMutation,
  useUpdateLeadFieldMutation,
  useReorderLeadFieldsMutation,
  useFilterLeadsMutation,
  useConvertToOpportunityMutation,
  useGetFieldStagesQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useGetLeadUpdatesQuery,
    useAddLeadUpdateMutation,
    useEditLeadUpdateMutation,
  useDeleteLeadMutation
} = LeadsApi;
export default LeadsApi;