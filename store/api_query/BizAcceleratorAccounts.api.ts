import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type AccountListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
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

const AccountsApi = createApi({
  reducerPath: 'accounts_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['accounts', 'account_fields', 'account_deals', 'account_updates', 'account_activities'],
  endpoints: (builder) => ({
    // Field definitions
    getAccountFields: builder.query<unknown, void>({
      query: () => ({ url: 'accounts/fields', method: 'GET' }),
      providesTags: ['account_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),

    // List and filter accounts
    getAccounts: builder.query<unknown, AccountListQuery | void>({
      query: (params) => ({ url: 'accounts', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['accounts'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    filterAccounts: builder.mutation<unknown, {
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
        url: 'accounts/filter',
        method: 'POST',
        body: {
          entityType: 'account',
          ...body
        }
      }),
      invalidatesTags: ['accounts'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Single account
    getAccount: builder.query<unknown, string>({
      query: (accountId) => ({ url: `accounts/${accountId}`, method: 'GET' }),
      providesTags: (result, error, accountId) => [
        { type: 'accounts', id: accountId },
        { type: 'account_deals', id: accountId },
        { type: 'account_activities', id: accountId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Create account
    createAccount: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({ url: 'accounts', method: 'POST', body: data }),
      invalidatesTags: ['accounts'],
    }),

    // Update account
    updateAccount: builder.mutation<unknown, { accountId: string; data: Record<string, unknown> }>({
      query: ({ accountId, data }) => ({ url: `accounts/${accountId}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { accountId }) => [
        'accounts',
        { type: 'accounts', id: accountId },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Delete account
    deleteAccount: builder.mutation<unknown, string>({
      query: (accountId) => ({ url: `accounts/${accountId}`, method: 'DELETE' }),
      invalidatesTags: ['accounts'],
    }),

    // Field management
    updateAccountField: builder.mutation<unknown, { 
      fieldId: string; 
      data: Partial<{ 
        displayName: string; 
        isVisible: boolean; 
        columnWidth: number; 
        displayOrder: number 
      }> 
    }>({
      query: ({ fieldId, data }) => ({ url: `accounts/fields/${fieldId}`, method: 'PUT', body: data }),
      invalidatesTags: ['account_fields'],
    }),

    reorderAccountFields: builder.mutation<unknown, { fieldOrders: Array<{ fieldId: string; displayOrder: number }> }>({
      query: ({ fieldOrders }) => ({ url: `accounts/fields/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['account_fields'],
    }),

    // Activities
    getAccountActivities: builder.query<unknown, string>({
      query: (accountId) => ({ url: `accounts/${accountId}/activities`, method: 'GET' }),
      providesTags: (result, error, accountId) => [{ type: 'account_activities', id: accountId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Deals
    getAccountDeals: builder.query<unknown, string>({
      query: (accountId) => ({ url: `accounts/${accountId}/deals`, method: 'GET' }),
      providesTags: (result, error, accountId) => [{ type: 'account_deals', id: accountId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Updates Management
    getAccountUpdates: builder.query<unknown, string>({
      query: (accountId) => ({ url: `accounts/${accountId}/updates`, method: 'GET' }),
      providesTags: (result, error, accountId) => [{ type: 'account_updates', id: accountId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    addAccountUpdate: builder.mutation<unknown, { accountId: string; content: string }>({
      query: ({ accountId, content }) => ({
        url: `accounts/${accountId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { accountId }) => [
        { type: 'account_updates', id: accountId },
        { type: 'accounts', id: accountId },
      ],
    }),

    editAccountUpdate: builder.mutation<unknown, { accountId: string; updateId: string; content: string }>({
      query: ({ accountId, updateId, content }) => ({
        url: `accounts/${accountId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (result, error, { accountId }) => [
        { type: 'account_updates', id: accountId },
        { type: 'accounts', id: accountId },
      ],
    }),

    deleteAccountUpdate: builder.mutation<unknown, { accountId: string; updateId: string }>({
      query: ({ accountId, updateId }) => ({
        url: `accounts/${accountId}/updates/${updateId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { accountId }) => [
        { type: 'account_updates', id: accountId },
        { type: 'accounts', id: accountId },
      ],
    }),

    // Views
    getAccountViews: builder.query<unknown, string | void>({
      query: (viewType) => ({ 
        url: 'accounts/views', 
        method: 'GET',
        params: viewType ? { viewType } : {}
      }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1200,
    }),

    // Export
    exportAccounts: builder.query<unknown, { viewId: string; filters?: Record<string, unknown> }>({
      query: ({ viewId, filters }) => ({
        url: `accounts/export/${viewId}`,
        method: 'GET',
        params: (filters ?? {}) as Record<string, string | number | boolean | undefined>,
      }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Advanced search
    advancedSearch: builder.mutation<unknown, Record<string, unknown>>({
      query: (searchCriteria) => ({
        url: 'accounts/search',
        method: 'POST',
        body: searchCriteria,
      }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
  }),
});

export const { 
  // Field definitions
  useGetAccountFieldsQuery,
  
  // List and filter
  useGetAccountsQuery,
  useFilterAccountsMutation,
  
  // Single account
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  
  // Field management
  useUpdateAccountFieldMutation,
  useReorderAccountFieldsMutation,
  
  // Activities
  useGetAccountActivitiesQuery,
  
  // Deals
  useGetAccountDealsQuery,
  
  // Updates management
  useGetAccountUpdatesQuery,
  useAddAccountUpdateMutation,
  useEditAccountUpdateMutation,
  useDeleteAccountUpdateMutation,
  
  // Views
  useGetAccountViewsQuery,
  
  // Export
  useExportAccountsQuery,
  
  // Search
  useAdvancedSearchMutation,
} = AccountsApi;

export default AccountsApi;