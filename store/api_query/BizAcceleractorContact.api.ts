import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const FormApi = createApi({
    reducerPath: 'bizacc_form_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as { auth?: { token?: string } };
            const token = state.auth?.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Accept", "application/json");
            return headers;
        },
    }),

    tagTypes: ['Contact', 'form'],
    endpoints: (builder) => ({
        // GET all contacts
        getFormContacts: builder.query<unknown, { page?: number; limit?: number; sortBy?: string; sortOrder?: string }>({
            query: (params = {}) => ({
                url: 'contacts',
                params: {
                    page: params.page || 1,
                    limit: params.limit || 50,
                    sortBy: params.sortBy,
                    sortOrder: params.sortOrder,
                },
            }),
            providesTags: ['Contact'],
        }),

        // GET single contact
        getContact: builder.query<unknown, string>({
            query: (contactId) => `contacts/${contactId}`,
            providesTags: (result, error, id) => [{ type: 'Contact', id }],
        }),

        // CREATE contact
        createContact: builder.mutation<unknown, Record<string, unknown>>({
            query: (contactData) => ({
                url: 'contacts',
                method: 'POST',
                body: contactData,
            }),
            invalidatesTags: ['Contact'],
        }),

        // UPDATE contact
        updateFormContact: builder.mutation<unknown, { contactId: string; data: Record<string, unknown> }>({
            query: ({ contactId, data }) => ({
                url: `contacts/${contactId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { contactId }) => [
                { type: 'Contact', id: contactId },
                'Contact',
            ],
        }),

        // DELETE contact
        deleteContact: builder.mutation<unknown, string>({
            query: (contactId) => ({
                url: `contacts/${contactId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Contact'],
        }),

        // GET contact fields
        getFormContactFields: builder.query<unknown, void>({
            query: () => `contacts/fields`,
            providesTags: ['form'],
        }),
        getContactFields: builder.query<unknown, void>({
            query: () => `contacts/fields`,
            providesTags: ['form'],
        }),

        // Add to the existing endpoints in BizAcceleractorContact.api.ts

        // GET dropdown choices for a field
        getDropdownChoices: builder.query<unknown, { fieldId: string; includeInactive?: boolean }>({
            query: ({ fieldId, includeInactive = false }) => ({
                url: `field-definitions/${fieldId}/dropdown/choices`,
                params: { includeInactive },
            }),
        }),

        // ADD dropdown choice
        addDropdownStatusChoice: builder.mutation<unknown, { fieldId: string; choiceData: Record<string, unknown> }>({
            query: ({ fieldId, choiceData }) => ({
                url: `field-definitions/${fieldId}/dropdown/choices`,
                method: 'POST',
                body: choiceData,
            }),
            
        }),

        // UPDATE dropdown choice
        updateDropdownStatusChoice: builder.mutation<unknown, { fieldId: string; choiceValue: string; updates: Record<string, unknown> }>({
            query: ({ fieldId, choiceValue, updates }) => ({
                url: `field-definitions/${fieldId}/dropdown/choices/${choiceValue}`,
                method: 'PUT',
                body: updates,
            }),
            
        }),

        // DELETE dropdown choice
        deleteDropdownChoice: builder.mutation<unknown, { fieldId: string; choiceValue: string }>({
            query: ({ fieldId, choiceValue }) => ({
                url: `field-definitions/${fieldId}/dropdown/choices/${choiceValue}`,
                method: 'DELETE',
            }),
            
        }),

        // REORDER dropdown choices
        reorderDropdownStatusChoices: builder.mutation<unknown, { fieldId: string; choices: Array<Record<string, unknown>> }>({
            query: ({ fieldId, choices }) => ({
                url: `field-definitions/${fieldId}/dropdown/reorder`,
                method: 'PUT',
                body: { choices },
            }),
            
        }),

    }),
});

export const {
    useGetFormContactFieldsQuery,
    useGetFormContactsQuery,
    useGetContactQuery,
    useCreateContactMutation,
    useUpdateFormContactMutation,
    useDeleteContactMutation,
    useGetContactFieldsQuery,
    useGetDropdownChoicesQuery,
    useAddDropdownStatusChoiceMutation,
    useUpdateDropdownStatusChoiceMutation,
    useDeleteDropdownChoiceMutation,
    useReorderDropdownStatusChoicesMutation,
} = FormApi;

export default FormApi;