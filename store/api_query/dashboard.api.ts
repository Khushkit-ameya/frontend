import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const DashboardApi = createApi({
    reducerPath: 'dashboard_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['dashboard'],
    endpoints: (builder) => ({
        getDashboardStats: builder.query({
            query: (companyId) => ({
                url: `dashboard/stats${companyId ? `?company=${companyId}` : ''}`,
                method: 'GET',
            }),
            providesTags: ['dashboard']
        }),
        getDashboardCharts: builder.query({
            query: ({ companyId, dateRange }) => ({
                url: `dashboard/charts?company=${companyId}&dateRange=${dateRange}`,
                method: 'GET',
            }),
            providesTags: ['dashboard']
        }),
        getRecentActivities: builder.query({
            query: (companyId) => ({
                url: `dashboard/activities?company=${companyId}`,
                method: 'GET',
            }),
            providesTags: ['dashboard']
        }),
    }),
});

export const {
    useGetDashboardStatsQuery,
    useGetDashboardChartsQuery,
    useGetRecentActivitiesQuery,
} = DashboardApi;

export default DashboardApi;
