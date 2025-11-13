import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';
import { Holiday } from '@/app/biz-ignite/Holiday/page';

const holidayApi = createApi({
  reducerPath: 'holiday_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    }
  }),
  tagTypes: ['OffDay'],
  endpoints: (builder) => ({
    getHolidayByCompanyId: builder.query<string[], Record<string, any> | undefined>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        console.log("params:",params);
        
        // Add filter parameters
        Object.entries(params || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const queryString = queryParams.toString();

        return { url: `companyoff/offday/company${queryString}`, method: 'GET' };
      },
      providesTags: ['OffDay'],
    }),

    createHoliday: builder.mutation({
      query: (holidayData) => ({
        url: 'companyoff/offday',
        method: 'POST',
        body: holidayData,
      }),
      invalidatesTags: ['OffDay'],
    }),

    // --------- UPDATE off day ---------
    updateOffDay: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `companyoff/offday/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['OffDay'],
    }),

    // --------- DELETE off day ---------
    deleteOffDay: builder.mutation({
      query: (id: string) => ({
        url: `companyoff/offday/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OffDay'],
    }),
  }),
});

export const {
  useGetHolidayByCompanyIdQuery,
  useCreateHolidayMutation,
  useUpdateOffDayMutation,
  useDeleteOffDayMutation,
} = holidayApi;

export default holidayApi;