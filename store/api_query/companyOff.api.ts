import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

interface CompanyOff {
  id: string;
  weekDay: number[];
  companyId: string;
}

const CompanyOffApi = createApi({
    reducerPath: 'companyOff_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        }
}),
    tagTypes: ['companyOff'],
    endpoints: (builder) => ({
       getCompanyOffs: builder.query<CompanyOff[], void>({
       query: () => ({ url: 'companyoff', method: 'GET' }),
       transformResponse: (response: { data?: CompanyOff[] } | CompanyOff[]): CompanyOff[] => {
       // if backend returns { data: [...] }
       if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data?: CompanyOff[] }).data ?? [];
    }
    // if backend returns array directly
    return response as CompanyOff[];
  },
  providesTags: ['companyOff'],
}),


        createCompanyOff: builder.mutation<unknown, Record<string, unknown>>({
            query: (companyOffData) => ({
                url: 'companyoff',
                method: 'POST',
                body: companyOffData,
            }),
            invalidatesTags: ['companyOff'],
        }),

         getCompanyUsers: builder.query<any[], void>({
      query: () => ({
        url: 'companyoff/users/all',
        method: 'GET',
      }),
      providesTags: ['companyOff'],
    }),
}),
});

export const {
    useGetCompanyOffsQuery,
    useGetCompanyUsersQuery,
    useCreateCompanyOffMutation,
} = CompanyOffApi;

export default CompanyOffApi;