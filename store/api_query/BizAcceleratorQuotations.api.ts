import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type QuotationListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  dealId?: string;
  opportunityId?: string;
  status?: string;
  viewName?: string;
  [key: string]: unknown;
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

const QuotationsApi = createApi({
  reducerPath: 'quotations_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'quotations',
    'quotation_fields',
    'quotation_updates',
    'deal_quotations',
    'opportunity_quotations',
  ],
  endpoints: (builder) => ({
    // Fields
    getQuotationFields: builder.query<unknown, void>({
      query: () => ({ url: 'quotations/fields', method: 'GET' }),
      providesTags: ['quotation_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),

    // List & filter
    getQuotations: builder.query<unknown, QuotationListQuery | void>({
      query: (params) => ({ url: 'quotations', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['quotations'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    filterQuotations: builder.mutation<unknown, {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      search?: string;
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
      entityType?: string;
    }>({
      query: (body) => ({
        url: 'quotations/filter',
        method: 'POST',
        body: {
          entityType: 'quotation',
          ...body,
        },
      }),
      invalidatesTags: ['quotations'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Single quotation
    getQuotation: builder.query<unknown, string>({
      query: (quotationId) => ({ url: `quotations/${quotationId}`, method: 'GET' }),
      providesTags: (result, error, quotationId) => [
        { type: 'quotations' as const, id: quotationId },
        { type: 'quotation_updates' as const, id: quotationId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 900,
    }),

    // Create quotation
    createQuotation: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({ url: 'quotations', method: 'POST', body: data }),
      invalidatesTags: ['quotations'],
    }),

    updateQuotation: builder.mutation<unknown, { quotationId: string; data: Record<string, unknown> }>({
      query: ({ quotationId, data }) => ({ url: `quotations/${quotationId}`, method: 'PUT', body: data }),
      invalidatesTags: ['quotations'],
    }),

    // Revise quotation (create a new version based on latest or given)
    reviseQuotation: builder.mutation<unknown, { quotationId: string; data?: Record<string, unknown> }>({
      query: ({ quotationId, data }) => ({ url: `quotations/${quotationId}/revise`, method: 'POST', body: data ?? {} }),
      invalidatesTags: ['quotations'],
    }),

    // Field management
    updateQuotationField: builder.mutation<unknown, { fieldId: string; data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }>({
      query: ({ fieldId, data }) => ({ url: `quotations/fields/${fieldId}`, method: 'PUT', body: data }),
      invalidatesTags: ['quotation_fields'],
    }),

    reorderQuotationFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
      query: ({ fieldOrders }) => ({ url: `quotations/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['quotation_fields'],
    }),

    // Linking
    getDealQuotations: builder.query<unknown, string>({
      query: (dealId) => ({ url: `quotations/by-deal/${dealId}`, method: 'GET' }),
      providesTags: (result, error, dealId) => [{ type: 'deal_quotations', id: dealId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    getOpportunityQuotations: builder.query<unknown, string>({
      query: (opportunityId) => ({ url: `quotations/by-opportunity/${opportunityId}`, method: 'GET' }),
      providesTags: (result, error, opportunityId) => [{ type: 'opportunity_quotations', id: opportunityId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Updates
    getQuotationUpdates: builder.query<unknown, string>({
      query: (quotationId) => ({ url: `quotations/${quotationId}/updates`, method: 'GET' }),
      providesTags: (result, error, quotationId) => [{ type: 'quotation_updates', id: quotationId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    addQuotationUpdate: builder.mutation<unknown, { quotationId: string; content: string }>({
      query: ({ quotationId, content }) => ({ url: `quotations/${quotationId}/updates`, method: 'POST', body: { content } }),
      invalidatesTags: (result, error, { quotationId }) => [
        { type: 'quotation_updates', id: quotationId },
        { type: 'quotations', id: quotationId },
      ],
    }),

    editQuotationUpdate: builder.mutation<unknown, { quotationId: string; updateId: string; content: string }>({
      query: ({ quotationId, updateId, content }) => ({ url: `quotations/${quotationId}/updates/${updateId}`, method: 'PUT', body: { content } }),
      invalidatesTags: (result, error, { quotationId }) => [
        { type: 'quotation_updates', id: quotationId },
        { type: 'quotations', id: quotationId },
      ],
    }),

    deleteQuotationUpdate: builder.mutation<unknown, { quotationId: string; updateId: string }>({
      query: ({ quotationId, updateId }) => ({ url: `quotations/${quotationId}/updates/${updateId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { quotationId }) => [
        { type: 'quotation_updates', id: quotationId },
        { type: 'quotations', id: quotationId },
      ],
    }),
  }),
});

export const {
  useGetQuotationFieldsQuery,
  useGetQuotationsQuery,
  useFilterQuotationsMutation,
  useGetQuotationQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useReviseQuotationMutation,
  useUpdateQuotationFieldMutation,
  useReorderQuotationFieldsMutation,
  useGetDealQuotationsQuery,
  useGetOpportunityQuotationsQuery,
  useGetQuotationUpdatesQuery,
  useAddQuotationUpdateMutation,
  useEditQuotationUpdateMutation,
  useDeleteQuotationUpdateMutation,
} = QuotationsApi;

export default QuotationsApi;
