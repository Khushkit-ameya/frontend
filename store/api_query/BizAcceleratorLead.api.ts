import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const BizAcceleratorLeadApi = createApi({
    reducerPath: 'bizacc_lead_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as { auth?: { token?: string } }).auth?.token;
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
            headers.set("Accept", "application/json");
            return headers;
        },
    }),

    tagTypes: ['Lead', 'form', 'fieldStages'],
    endpoints: (builder) => ({
        // Get lead form fields
        getFormLeadFields: builder.query<unknown, void>({
            query: () => '/leads/fields',
            providesTags: ['form'],
        }),

        // Get field stages (status pipeline)
        getFieldStages: builder.query<unknown, { fieldId: string; includeInactive?: boolean }>({
            query: ({ fieldId, includeInactive = false }: { fieldId: string; includeInactive?: boolean }) => 
                `/field-definitions/${fieldId}/stages?includeInactive=${includeInactive}`,
            providesTags: ['fieldStages'],
        }),

        // Get single lead
        getLead: builder.query<unknown, string>({
            query: (leadId: string) => `/leads/${leadId}`,
            providesTags: ['Lead'],
        }),

        // Create lead
        createLead: builder.mutation<unknown, Record<string, unknown>>({
            query: (data) => ({
                url: '/leads',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Lead'],
        }),

        // Update lead
        updateLead: builder.mutation<unknown, { leadId: string; data: Record<string, unknown> }>({
            query: ({ leadId, data }) => ({
                url: `/leads/${leadId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Lead'],
        }),

        // Delete lead
        deleteLead: builder.mutation<unknown, string>({
            query: (leadId: string) => ({
                url: `/leads/${leadId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Lead'],
        }),
    }),
});

export const {
    useGetFormLeadFieldsQuery,
    useGetFieldStagesQuery,
    useGetLeadQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
} = BizAcceleratorLeadApi;

export default BizAcceleratorLeadApi;