import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type EntityType = 'contact' | 'lead' | 'opportunity' | 'deal' | 'client' | 'account' | string;

const FieldDefinitionsApi = createApi({
  reducerPath: 'field_definitions_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['field_definitions'],
  endpoints: (builder) => ({
    getFieldDefinitionsByEntity: builder.query<unknown[], { entityType: EntityType; includeInactive?: boolean } | EntityType>({
      query: (arg) => {
        const entityType = typeof arg === 'string' ? arg : arg.entityType;
        const includeInactive = typeof arg === 'string' ? true : (arg.includeInactive ?? true);
        return { url: `field-definitions`, method: 'GET', params: { entityType, includeInactive } };
      },
      providesTags: ['field_definitions'],
      transformResponse: (res: unknown): unknown[] => {
        if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
          return ((res as { data?: unknown[] }).data ?? []) as unknown[];
        }
        return res as unknown[];
      },
      keepUnusedDataFor: 1800,
    }),
    // Update a field definition (e.g., displayName, isVisible, columnWidth, displayOrder)
    updateFieldDefinition: builder.mutation<
      unknown,
      { fieldId: string; updates: Partial<{ displayName: string; isVisible: boolean; columnWidth: number; displayOrder: number }> }
    >({
      query: ({ fieldId, updates }) => ({ url: `field-definitions/${fieldId}`, method: 'PUT', body: updates }),
      invalidatesTags: ['field_definitions'],
    }),
    // Reorder fields for an entity type
    reorderFieldsForEntity: builder.mutation<
      unknown,
      { entityType: EntityType; fieldOrders: Array<{ fieldId: string; displayOrder: number }> }
    >({
      query: ({ entityType, fieldOrders }) => ({ url: `field-definitions/entity/${entityType}/reorder`, method: 'PUT', body: { fieldOrders } }),
      invalidatesTags: ['field_definitions'],
    }),
    addDropdownChoice: builder.mutation<
      unknown,
      { fieldId: string; value: string; label: string; color?: string; order?: number }
    >({
      query: ({ fieldId, ...body }) => ({ url: `field-definitions/${fieldId}/dropdown/choices`, method: 'POST', body }),
      invalidatesTags: ['field_definitions'],
    }),
    updateDropdownChoice: builder.mutation<
      unknown,
      { fieldId: string; value: string; updates: { label?: string; color?: string; order?: number; isActive?: boolean; [k: string]: unknown } }
    >({
      query: ({ fieldId, value, updates }) => ({ url: `field-definitions/${fieldId}/dropdown/choices/${value}`, method: 'PUT', body: updates }),
      invalidatesTags: ['field_definitions'],
    }),
    reorderDropdownChoices: builder.mutation<
      unknown,
      { fieldId: string; choices: Array<{ value: string; order: number; label?: string; color?: string; [k: string]: unknown }> }
    >({
      query: ({ fieldId, choices }) => ({ url: `field-definitions/${fieldId}/dropdown/reorder`, method: 'PUT', body: { choices } }),
      invalidatesTags: ['field_definitions'],
    }),
    deleteDropdownChoice: builder.mutation<
      unknown,
      { fieldId: string; value: string }
    >({
      query: ({ fieldId, value }) => ({ 
        url: `field-definitions/${fieldId}/dropdown/choices/${encodeURIComponent(value)}`, 
        method: 'DELETE' 
      }),
      invalidatesTags: ['field_definitions'],
    }),
  }),
});

export const { useGetFieldDefinitionsByEntityQuery, useUpdateFieldDefinitionMutation, useReorderFieldsForEntityMutation, useAddDropdownChoiceMutation, useUpdateDropdownChoiceMutation, useReorderDropdownChoicesMutation, useDeleteDropdownChoiceMutation } = FieldDefinitionsApi;
export default FieldDefinitionsApi;
