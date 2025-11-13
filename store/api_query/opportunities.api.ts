import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type OpportunityListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  leadId?: string;
  contactId?: string;
  viewName?: string;
  [key: string]: unknown;
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
};

export type LinkDealPayload = {
  relationshipType?: string;
  isPrimary?: boolean;
};

export type CreateDealFromOpportunityPayload = Record<string, unknown>;

const OpportunitiesApi = createApi({
  reducerPath: 'opportunities_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['opportunities', 'opportunity_fields', 'opportunity_deals', 'opportunity_updates'],
  endpoints: (builder) => ({
    // Existing endpoints
    getOpportunityFields: builder.query<unknown, void>({
      query: () => ({ url: 'opportunities/fields', method: 'GET' }),
      providesTags: ['opportunity_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),
    getOpportunities: builder.query<unknown, OpportunityListQuery | void>({
      query: (params) => ({ url: 'opportunities', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['opportunities'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    filterOpportunities: builder.mutation<unknown, {
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
        url: 'opportunities/filter',
        method: 'POST',
        body: {
          entityType: 'opportunity',
          ...body
        }
      }),
      invalidatesTags: ['opportunities'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    getOpportunity: builder.query<unknown, string>({
      query: (opportunityId) => ({ url: `opportunities/${opportunityId}`, method: 'GET' }),
      providesTags: (result, error, opportunityId) => [
        { type: 'opportunities', id: opportunityId },
        { type: 'opportunity_deals', id: opportunityId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    createOpportunity: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({ url: 'opportunities', method: 'POST', body: data }),
      invalidatesTags: ['opportunities'],
    }),
    updateOpportunity: builder.mutation<unknown, { opportunityId: string; data: Record<string, unknown> }>({
      query: ({ opportunityId, data }) => ({ url: `opportunities/${opportunityId}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { opportunityId }) => [
        'opportunities',
        { type: 'opportunities', id: opportunityId },
      ],
    }),
    updateOpportunityField: builder.mutation<unknown, { fieldId: string; data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }>(
      {
        query: ({ fieldId, data }) => ({ url: `opportunities/fields/${fieldId}`, method: 'PUT', body: data }),
        invalidatesTags: ['opportunity_fields'],
      }
    ),
    reorderOpportunityFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>(
      {
        query: ({ fieldOrders }) => ({ url: `opportunities/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
        invalidatesTags: ['opportunity_fields'],
      }
    ),

    // NEW: Deal Management Endpoints
    getOpportunityDeals: builder.query<unknown, string>({
      query: (opportunityId) => ({ url: `opportunities/${opportunityId}/deals`, method: 'GET' }),
      providesTags: (result, error, opportunityId) => [{ type: 'opportunity_deals', id: opportunityId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    createDealFromOpportunity: builder.mutation<unknown, { opportunityId: string; data: CreateDealFromOpportunityPayload }>({
      query: ({ opportunityId, data }) => ({
        url: `opportunities/${opportunityId}/create-deal`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        'opportunities',
        { type: 'opportunities', id: opportunityId },
        { type: 'opportunity_deals', id: opportunityId },
      ],
    }),

    linkDealToOpportunity: builder.mutation<unknown, { opportunityId: string; dealId: string; data?: LinkDealPayload }>({
      query: ({ opportunityId, dealId, data }) => ({
        url: `opportunities/${opportunityId}/link-deal/${dealId}`,
        method: 'POST',
        body: data ?? {},
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        'opportunities',
        { type: 'opportunities', id: opportunityId },
        { type: 'opportunity_deals', id: opportunityId },
      ],
    }),

    unlinkDealFromOpportunity: builder.mutation<unknown, { opportunityId: string; dealId: string }>({
      query: ({ opportunityId, dealId }) => ({
        url: `opportunities/${opportunityId}/link-deal/${dealId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        'opportunities',
        { type: 'opportunities', id: opportunityId },
        { type: 'opportunity_deals', id: opportunityId },
      ],
    }),

    // NEW: Updates Management Endpoints
    getOpportunityUpdates: builder.query<unknown, string>({
      query: (opportunityId) => ({ url: `opportunities/${opportunityId}/updates`, method: 'GET' }),
      providesTags: (result, error, opportunityId) => [{ type: 'opportunity_updates', id: opportunityId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    addOpportunityUpdate: builder.mutation<unknown, { opportunityId: string; content: string }>({
      query: ({ opportunityId, content }) => ({
        url: `opportunities/${opportunityId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        { type: 'opportunity_updates', id: opportunityId },
        { type: 'opportunities', id: opportunityId },
      ],
    }),

    editOpportunityUpdate: builder.mutation<unknown, { opportunityId: string; updateId: string; content: string }>({
      query: ({ opportunityId, updateId, content }) => ({
        url: `opportunities/${opportunityId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        { type: 'opportunity_updates', id: opportunityId },
        { type: 'opportunities', id: opportunityId },
      ],
    }),

    deleteOpportunityUpdate: builder.mutation<unknown, { opportunityId: string; updateId: string }>({
      query: ({ opportunityId, updateId }) => ({
        url: `opportunities/${opportunityId}/updates/${updateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { opportunityId }) => [
        { type: 'opportunity_updates', id: opportunityId },
        { type: 'opportunities', id: opportunityId },
      ],
    }),

    // Delete opportunity
    deleteOpportunity: builder.mutation<void, string>({
      query: (opportunityId) => ({ url: `opportunities/${opportunityId}`, method: 'DELETE' }),
      invalidatesTags: ['opportunities'],
    }),
  }),
});

export const { 
  // Existing exports
  useGetOpportunityFieldsQuery,
  useGetOpportunitiesQuery,
  useGetOpportunityQuery,
  useCreateOpportunityMutation,
  useUpdateOpportunityMutation,
  useUpdateOpportunityFieldMutation,
  useReorderOpportunityFieldsMutation,
  useFilterOpportunitiesMutation,
  // NEW: Deal management exports
  useGetOpportunityDealsQuery,
  useCreateDealFromOpportunityMutation,
  useLinkDealToOpportunityMutation,
  useUnlinkDealFromOpportunityMutation,
  // NEW: Updates management exports
  useGetOpportunityUpdatesQuery,
  useAddOpportunityUpdateMutation,
  useEditOpportunityUpdateMutation,
  useDeleteOpportunityUpdateMutation,
  useDeleteOpportunityMutation,
} = OpportunitiesApi;

export default OpportunitiesApi;