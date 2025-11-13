import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const CompanyApi = createApi({
    reducerPath: 'company_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['company'],
    endpoints: (builder) => ({
        getCompanies: builder.query({
            query: () => ({
                url: 'companies',
                method: 'GET',
            }),
            providesTags: ['company']
        }),
        getCompanyById: builder.query({
            query: (id) => ({
                url: `companies/${id}`,
                method: 'GET',
            }),
            providesTags: ['company']
        }),
        createCompany: builder.mutation({
            query: (companyData) => ({
                url: 'companies',
                method: 'POST',
                body: companyData,
            }),
            invalidatesTags: ['company'],
        }),
        updateCompany: builder.mutation({
            query: ({ id, ...companyData }) => ({
                url: `companies/${id}`,
                method: 'PUT',
                body: companyData,
            }),
            invalidatesTags: ['company'],
        }),
        updateCompanyTheme: builder.mutation({
            query: ({ id, themeColor }) => ({
                url: `companies/${id}/theme`,
                method: 'PATCH',
                body: { themeColor },
            }),
            invalidatesTags: ['company'],
        }),
        deleteCompany: builder.mutation({
            query: (id) => ({
                url: `companies/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['company'],
        }),
    }),
});

export const {
    useGetCompaniesQuery,
    useGetCompanyByIdQuery,
    useCreateCompanyMutation,
    useUpdateCompanyMutation,
    useUpdateCompanyThemeMutation,
    useDeleteCompanyMutation,
} = CompanyApi;

export default CompanyApi;
