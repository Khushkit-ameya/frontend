import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type CustomerListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  accountId?: string;
  opportunityId?: string;
  viewName?: string;
  [key: string]: unknown;
  // Filter support
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

const CustomersApi = createApi({
  reducerPath: 'customers_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'customers',
    'customer_fields',
    'customer_deals',
    'customer_updates',
    'customer_activities',
    'customer_views'
  ],
  endpoints: (builder) => ({
    // Field definitions
    getCustomerFields: builder.query<unknown, void>({
      query: () => ({ url: 'customers/fields', method: 'GET' }),
      providesTags: ['customer_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),

    // List and filter customers
    getCustomers: builder.query<unknown, CustomerListQuery | void>({
      query: (params) => ({ url: 'customers', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['customers'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    filterCustomers: builder.mutation<unknown, {
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
      entityType?: string;
    }>({
      query: (body) => ({
        url: 'customers/filter',
        method: 'POST',
        body: {
          entityType: 'customer',
          ...body
        }
      }),
      invalidatesTags: ['customers'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Single customer
    getCustomer: builder.query<unknown, string>({
      query: (customerId) => ({ url: `customers/${customerId}`, method: 'GET' }),
      providesTags: (result, error, customerId) => [
        { type: 'customers', id: customerId },
        { type: 'customer_deals', id: customerId },
        { type: 'customer_activities', id: customerId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Update customer (inline editing)
    updateCustomer: builder.mutation<unknown, { customerId: string; data: Record<string, unknown> }>({
      query: ({ customerId, data }) => ({ url: `customers/${customerId}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { customerId }) => [
        'customers',
        { type: 'customers', id: customerId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Field management
    updateCustomerField: builder.mutation<unknown, {
      fieldId: string;
      data: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }>
    }>({
      query: ({ fieldId, data }) => ({ url: `customers/fields/${fieldId}`, method: 'PUT', body: data }),
      invalidatesTags: ['customer_fields'],
    }),

    reorderCustomerFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
      query: ({ fieldOrders }) => ({ url: `customers/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['customer_fields'],
    }),

    // Activities & Deals
    getCustomerActivities: builder.query<unknown, string>({
      query: (customerId) => ({ url: `customers/${customerId}/activities`, method: 'GET' }),
      providesTags: (result, error, customerId) => [{ type: 'customer_activities', id: customerId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    getCustomerDeals: builder.query<unknown, string>({
      query: (customerId) => ({ url: `customers/${customerId}/deals`, method: 'GET' }),
      providesTags: (result, error, customerId) => [{ type: 'customer_deals', id: customerId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Updates management
    getCustomerUpdates: builder.query<unknown, string>({
      query: (customerId) => ({ url: `customers/${customerId}/updates`, method: 'GET' }),
      providesTags: (result, error, customerId) => [{ type: 'customer_updates', id: customerId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    addCustomerUpdate: builder.mutation<unknown, { customerId: string; content: string }>({
      query: ({ customerId, content }) => ({ url: `customers/${customerId}/updates`, method: 'POST', body: { content } }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'customer_updates', id: customerId },
        { type: 'customers', id: customerId },
      ],
    }),

    editCustomerUpdate: builder.mutation<unknown, { customerId: string; updateId: string; content: string }>({
      query: ({ customerId, updateId, content }) => ({ url: `customers/${customerId}/updates/${updateId}`, method: 'PUT', body: { content } }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'customer_updates', id: customerId },
        { type: 'customers', id: customerId },
      ],
    }),

    deleteCustomerUpdate: builder.mutation<unknown, { customerId: string; updateId: string }>({
      query: ({ customerId, updateId }) => ({ url: `customers/${customerId}/updates/${updateId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'customer_updates', id: customerId },
        { type: 'customers', id: customerId },
      ],
    }),

    // Views
    getCustomerViews: builder.query<unknown, string | void>({
      query: (viewType) => ({ url: 'customers/views', method: 'GET', params: viewType ? { viewType } : {} }),
      providesTags: ['customer_views'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1200,
    }),

    // Export
    exportCustomers: builder.query<unknown, { viewId: string; filters?: Record<string, unknown> }>({
      query: ({ viewId, filters }) => ({
        url: `customers/export/${viewId}`,
        method: 'GET',
        params: (filters ?? {}) as Record<string, string | number | boolean | undefined>,
      }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
  }),
});

export const {
  // Fields
  useGetCustomerFieldsQuery,

  // List & filter
  useGetCustomersQuery,
  useFilterCustomersMutation,

  // Single
  useGetCustomerQuery,
  useUpdateCustomerMutation,

  // Field management
  useUpdateCustomerFieldMutation,
  useReorderCustomerFieldsMutation,

  // Activities & deals
  useGetCustomerActivitiesQuery,
  useGetCustomerDealsQuery,

  // Updates
  useGetCustomerUpdatesQuery,
  useAddCustomerUpdateMutation,
  useEditCustomerUpdateMutation,
  useDeleteCustomerUpdateMutation,

  // Views
  useGetCustomerViewsQuery,

  // Export
  useExportCustomersQuery,
} = CustomersApi;

export default CustomersApi;
