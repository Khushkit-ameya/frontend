import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type DealListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  clientId?: string;
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

const DealsApi = createApi({
  reducerPath: 'deals_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['deals', 'deal_fields', 'deal_opportunities', 'deal_updates'],
  endpoints: (builder) => ({
    getDealFields: builder.query<unknown, void>({
      query: () => ({ url: 'deals/fields', method: 'GET' }),
      providesTags: ['deal_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),
    getDeals: builder.query<unknown, DealListQuery | void>({
      query: (params) => ({ url: 'deals', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['deals'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    filterDeals: builder.mutation<unknown, {
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
        url: 'deals/filter',
        method: 'POST',
        body: {
          entityType: 'deals',
          ...body
        }
      }),
      invalidatesTags: ['deals'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    // Opportunities linked to a deal
    getDealOpportunities: builder.query<unknown, string>({
      query: (dealId) => ({ url: `deals/${dealId}/opportunities`, method: 'GET' }),
      providesTags: (result, error, dealId) => [{ type: 'deal_opportunities', id: dealId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1200,
    }),
    linkOpportunityToDeal: builder.mutation<unknown, { dealId: string; opportunityId: string; data?: { relationshipType?: string; isPrimary?: boolean } }>({
      query: ({ dealId, opportunityId, data }) => ({ url: `deals/${dealId}/link-opportunity/${opportunityId}`, method: 'POST', body: data ?? {} }),
      invalidatesTags: (result, error, { dealId }) => [
        'deals',
        { type: 'deal_opportunities', id: dealId },
      ],
    }),
    unlinkOpportunityFromDeal: builder.mutation<unknown, { dealId: string; opportunityId: string }>({
      query: ({ dealId, opportunityId }) => ({ url: `deals/${dealId}/link-opportunity/${opportunityId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { dealId }) => [
        'deals',
        { type: 'deal_opportunities', id: dealId },
      ],
    }),
    updateDeal: builder.mutation<unknown, { dealId: string; data: Record<string, unknown> }>({
      query: ({ dealId, data }) => ({ url: `deals/${dealId}`, method: 'PUT', body: data }),
      invalidatesTags: ['deals'],
    }),

    // Delete deal
    deleteDeal: builder.mutation<void, string>({
      query: (dealId) => ({ url: `deals/${dealId}`, method: 'DELETE' }),
      invalidatesTags: ['deals'],
    }),
    updateDealField: builder.mutation<unknown, { fieldId: string; data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }>({
      query: ({ fieldId, data }) => ({ url: `deals/fields/${fieldId}`, method: 'PUT', body: data }),
      invalidatesTags: ['deal_fields'],
    }),
    reorderDealFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
      query: ({ fieldOrders }) => ({ url: `deals/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['deal_fields'],
    }),

    // NEW: Get single deal
    getDeal: builder.query<unknown, string>({
      query: (dealId) => ({ url: `deals/${dealId}`, method: 'GET' }),
      providesTags: (result, error, dealId) => [
        { type: 'deals', id: dealId },
        { type: 'deal_opportunities', id: dealId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // NEW: Create standalone deal
    createDeal: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({ url: 'deals/standalone', method: 'POST', body: data }),
      invalidatesTags: ['deals'],
    }),

    // NEW: Updates Management Endpoints
    getDealUpdates: builder.query<unknown, string>({
      query: (dealId) => ({ url: `deals/${dealId}/updates`, method: 'GET' }),
      providesTags: (_result, _error, dealId) => [{ type: 'deal_updates', id: dealId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    addDealUpdate: builder.mutation<unknown, { dealId: string; content: string }>({
      query: ({ dealId, content }) => ({
        url: `deals/${dealId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { dealId }) => [
        { type: 'deal_updates', id: dealId },
        { type: 'deals', id: dealId },
      ],
    }),

    editDealUpdate: builder.mutation<unknown, { dealId: string; updateId: string; content: string }>({
      query: ({ dealId, updateId, content }) => ({
        url: `deals/${dealId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (_result, _error, { dealId }) => [
        { type: 'deal_updates', id: dealId },
        { type: 'deals', id: dealId },
      ],
    }),

    deleteDealUpdate: builder.mutation<unknown, { dealId: string; updateId: string }>({
      query: ({ dealId, updateId }) => ({
        url: `deals/${dealId}/updates/${updateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { dealId }) => [
        { type: 'deal_updates', id: dealId },
        { type: 'deals', id: dealId },
      ],
    }),

  }),
});

export const { useGetDealFieldsQuery, useGetDealsQuery, useFilterDealsMutation, useGetDealOpportunitiesQuery, useLinkOpportunityToDealMutation, useUnlinkOpportunityFromDealMutation, useUpdateDealMutation, useUpdateDealFieldMutation, useReorderDealFieldsMutation, useGetDealQuery,
  useCreateDealMutation,
  useGetDealUpdatesQuery,
  useAddDealUpdateMutation,
  useEditDealUpdateMutation,
  useDeleteDealUpdateMutation,
  useDeleteDealMutation, } = DealsApi;
export default DealsApi;
