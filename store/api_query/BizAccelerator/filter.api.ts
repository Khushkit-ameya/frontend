// src/store/api_query/filters.api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

export interface FilterRule {
  fieldKey: string;
  condition: string;
  value: unknown;
  values?: unknown[];
}

export interface FilterGroup {
  logic: 'AND' | 'OR';
  rules: Array<FilterRule | FilterGroup>;
}

export interface SavedFilter {
  id: string;
  name: string;
  entityType: string;
  filterDefinition: FilterGroup;
  isDefault: boolean;
  isShared: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

const FiltersApi = createApi({
  reducerPath: 'filters_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['SavedFilters', 'FilterSchema'],
  endpoints: (builder) => ({
    // Get filter schema for an entity type
    getFilterSchema: builder.query<unknown, string>({
      query: (entityType) => ({
        url: `filters/schema/${entityType}`,
        method: 'GET',
      }),
      providesTags: (result, error, entityType) => [
        { type: 'FilterSchema', id: entityType },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Get field options for dropdowns
    getFieldOptions: builder.query<unknown, { entityType: string; fieldKey: string }>({
      query: ({ entityType, fieldKey }) => ({
        url: `filters/field-options/${entityType}/${fieldKey}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Save a new filter
    saveFilter: builder.mutation<SavedFilter, {
      name: string;
      entityType: 'contact' | 'lead' | 'opportunity' | 'deal' | 'client' | 'account' | 'customer' | 'payment' | 'quotation';
      filterGroup: FilterGroup;
      isDefault?: boolean;
      isShared?: boolean;
      description?: string;
    }>({
      query: (body) => ({
        url: 'filters',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'SavedFilters', id: arg.entityType },
      ],
      transformResponse: (res: unknown): SavedFilter => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          const d = (res as { data?: SavedFilter }).data;
          return (d ?? (res as SavedFilter)) as SavedFilter;
        }
        return res as SavedFilter;
      },
    }),

    // Get saved filters for an entity type
    getSavedFilters: builder.query<SavedFilter[], string>({
      query: (entityType) => ({
        url: `filters/saved/${entityType}`,
        method: 'GET',
      }),
      providesTags: (result, error, entityType) => [
        { type: 'SavedFilters', id: entityType },
      ],
      transformResponse: (res: unknown): SavedFilter[] => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          const d = (res as { data?: SavedFilter[] }).data;
          return (d ?? (res as unknown as SavedFilter[])) as SavedFilter[];
        }
        return res as unknown as SavedFilter[];
      },
    }),

    // Get a specific saved filter
    getSavedFilter: builder.query<SavedFilter, { entityType: string; filterId: string }>({
      query: ({ entityType, filterId }) => ({
        url: `filters/saved/${entityType}/${filterId}`,
        method: 'GET',
      }),
      transformResponse: (res: unknown): SavedFilter => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          const d = (res as { data?: SavedFilter }).data;
          return (d ?? (res as SavedFilter)) as SavedFilter;
        }
        return res as SavedFilter;
      },
    }),

    // Update a saved filter
    updateFilter: builder.mutation<SavedFilter, {
      filterId: string;
      name?: string;
      filterDefinition?: FilterGroup;
      isDefault?: boolean;
      isShared?: boolean;
      description?: string;
    }>({
      query: ({ filterId, ...body }) => ({
        url: `filters/${filterId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, _arg) => [
        { type: 'SavedFilters', id: 'LIST' },
      ],
      transformResponse: (res: unknown): SavedFilter => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          const d = (res as { data?: SavedFilter }).data;
          return (d ?? (res as SavedFilter)) as SavedFilter;
        }
        return res as SavedFilter;
      },
    }),

    // Delete a saved filter
    deleteFilter: builder.mutation<void, string>({
      query: (filterId) => ({
        url: `filters/${filterId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, _filterId) => [
        { type: 'SavedFilters', id: 'LIST' },
      ],
    }),

    // Duplicate a saved filter
    duplicateFilter: builder.mutation<SavedFilter, { filterId: string; newName: string }>({
      query: ({ filterId, newName }) => ({
        url: `filters/${filterId}/duplicate`,
        method: 'POST',
        body: { newName },
      }),
      invalidatesTags: (_result, _error, _arg) => [
        { type: 'SavedFilters', id: 'LIST' },
      ],
      transformResponse: (res: unknown): SavedFilter => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          const d = (res as { data?: SavedFilter }).data;
          return (d ?? (res as SavedFilter)) as SavedFilter;
        }
        return res as SavedFilter;
      },
    }),
  }),
});

export const {
  useGetFilterSchemaQuery,
  useGetFieldOptionsQuery,
  useSaveFilterMutation,
  useGetSavedFiltersQuery,
  useGetSavedFilterQuery,
  useUpdateFilterMutation,
  useDeleteFilterMutation,
  useDuplicateFilterMutation,
} = FiltersApi;

export default FiltersApi;