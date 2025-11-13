import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type ContactListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  assignedToId?: string;
  includeConverted?: boolean;
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

const ContactsApi = createApi({
  reducerPath: 'contacts_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['contacts', 'contact_fields'],
  endpoints: (builder) => ({
    getContactFields: builder.query<unknown, void>({
      query: () => ({ url: 'contacts/fields', method: 'GET' }),
      providesTags: ['contact_fields'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 1800,
    }),
    getContacts: builder.query<unknown, ContactListQuery | void>({
      query: (params) => ({
        url: 'contacts',
        method: 'GET',
        params: (params ?? {}) as Record<string, string | number | boolean | undefined>
      }),
      providesTags: (result) => {
        const items = (result as { items?: Array<Record<string, unknown>> })?.items;
        if (Array.isArray(items)) {
          const tags = items.map((it) => ({ type: 'contacts' as const, id: String((it as { id?: unknown }).id) }));
          return [...tags, { type: 'contacts', id: 'LIST' }];
        }
        return [{ type: 'contacts', id: 'LIST' }];
      },
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    filterContacts: builder.mutation<unknown, {
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
        url: 'contacts/filter',
        method: 'POST',
        body: {
          entityType: 'contact',
          ...body
        }
      }),
      invalidatesTags: ['contacts'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    updateContact: builder.mutation<unknown, { contactId: string; data: Record<string, unknown> }>({
      query: ({ contactId, data }) => ({
        url: `contacts/${contactId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: (result, error, { contactId }) => [
        { type: 'contacts', id: contactId },
        { type: 'contacts', id: 'LIST' },
      ],
      // Optimistic update for instant feedback
      async onQueryStarted({ contactId, data }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ContactsApi.util.updateQueryData('getContacts', undefined, (draft) => {
            const d = draft as { items?: Array<Record<string, unknown>> };
            const list = Array.isArray(d.items) ? d.items : [];
            const idx = list.findIndex((i) => String((i as { id?: unknown }).id) === contactId);
            if (idx >= 0) Object.assign(list[idx], data);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    convertContactToLead: builder.mutation<unknown, { contactId: string; data?: Record<string, unknown> }>({
      query: ({ contactId, data }) => ({
        url: `contacts/${contactId}/convert-to-lead`,
        method: 'POST',
        body: data ?? {}
      }),
      invalidatesTags: (result, error, { contactId }) => [
        { type: 'contacts', id: contactId },
        { type: 'contacts', id: 'LIST' },
      ],
    }),
    updateContactField: builder.mutation<unknown, {
      fieldId: string;
      data: Partial<{
        displayName: string;
        isVisible: boolean;
        columnWidth: number;
        displayOrder: number
      }>
    }>({
      query: ({ fieldId, data }) => ({
        url: `contacts/fields/${fieldId}`,
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['contact_fields'],
    }),
    reorderContactFields: builder.mutation<unknown, {
      fieldOrders: Array<{ fieldId: string; displayOrder: number }>
    }>({
      query: ({ fieldOrders }) => ({
        url: `contacts/fields/reorder`,
        method: 'PUT',
        body: { fieldOrders }
      }),
      invalidatesTags: ['contact_fields'],
    }),
    getContactActivities: builder.query<unknown, string>({
      query: (contactId) => ({ url: `contacts/${contactId}/activities`, method: 'GET' }),
      providesTags: (result, error, contactId) => [
        { type: 'contacts', id: contactId },
        { type: 'contacts', id: 'LIST' },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    // NEW: Get single contact
    getContact: builder.query<unknown, string>({
      query: (contactId) => ({ url: `contacts/${contactId}`, method: 'GET' }),
      providesTags: (result, error, contactId) => [
        { type: 'contacts', id: contactId },
        { type: 'contacts', id: 'LIST' },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    // NEW: Create contact
    createContact: builder.mutation<unknown, { data: Record<string, unknown> }>({
      query: ({ data }) => ({
        url: 'contacts',
        method: 'POST',
        body: data, // Send data directly, not wrapped
      }),
      invalidatesTags: ['contacts'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    // NEW: Update contact (for form)
    updateFormContact: builder.mutation<unknown, { contactId: string; data: Record<string, unknown> }>({
      query: ({ contactId, data }) => ({
        url: `contacts/${contactId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { contactId }) => [
        { type: 'contacts' as const, id: contactId },
        { type: 'contacts' as const, id: 'LIST' },
      ],
    }),
    createContactUpdate: builder.mutation<unknown, { contactId: string; content: string }>({
      query: ({ contactId, content }) => ({
        url: `contacts/${contactId}/updates`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['contacts'],
    }),
    getContactUpdates: builder.query<unknown, string>({
      query: (contactId) => ({ url: `contacts/${contactId}/updates`, method: 'GET' }),
      providesTags: (result, error, contactId) => [
        { type: 'contacts', id: contactId },
        { type: 'contacts', id: 'LIST' },
      ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),
    editContactUpdate: builder.mutation<unknown, { contactId: string; updateId: string; content: string }>({
      query: ({ contactId, updateId, content }) => ({
        url: `contacts/${contactId}/updates/${updateId}`,
        method: 'PUT',
        body: { content },
      }),
       invalidatesTags: (_result, _error, { contactId }) => [
        { type: 'contacts' as const, id: contactId },
        { type: 'contacts' as const, id: 'LIST' },
      ],
    }),

    // Delete contact
    deleteContact: builder.mutation<void, string>({
      query: (contactId) => ({ url: `contacts/${contactId}`, method: 'DELETE' }),
      invalidatesTags: ['contacts'],
    }),
  }),
});

export const {
  useGetContactFieldsQuery,
  useGetContactsQuery,
  useFilterContactsMutation,
  useUpdateContactMutation,
  useConvertContactToLeadMutation,
  useUpdateContactFieldMutation,
  useReorderContactFieldsMutation,
  useGetContactActivitiesQuery,
  useGetContactQuery,
  useGetContactUpdatesQuery,
  useCreateContactMutation,
  useUpdateFormContactMutation,
  useCreateContactUpdateMutation,
  useEditContactUpdateMutation,
  useDeleteContactMutation,

} = ContactsApi;

export default ContactsApi;