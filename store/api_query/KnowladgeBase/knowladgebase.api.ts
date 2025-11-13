import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../../baseUrl';

const KnowledgebaseApi = createApi({
    reducerPath: 'knowledgebase_api',
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

    tagTypes: ['KnowledgeDocument', 'KnowledgeVersion', 'KnowledgeComment'],
    endpoints: (builder) => ({
        createKnowledgeDocument: builder.mutation({
            query: (data) => ({
                url: 'knowledge-base',
                method: 'POST',
                body: data,
            }),
        }),

        updateKnowledgeDocument: builder.mutation({
            query: ({ id, data }) => ({
                url: `knowledge-base/${id}`,
                method: 'PATCH',
                body: data,
            }),
        }),

        getKnowledgeDocuments: builder.query({
            query: (params) => `knowledge-base?${new URLSearchParams(params).toString()}`,
        }),

        getKnowledgeDocument: builder.query({
            query: (id) => `knowledge-base/${id}`,
        }),

        updateDocumentStatus: builder.mutation({
            query: ({ id, status }) => ({
                url: `knowledge-base/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
        }),
    }),
});

export const { 
    useCreateKnowledgeDocumentMutation, 
    useUpdateKnowledgeDocumentMutation,
    useGetKnowledgeDocumentsQuery,
    useGetKnowledgeDocumentQuery,
    useUpdateDocumentStatusMutation 
} = KnowledgebaseApi;
export default KnowledgebaseApi;
