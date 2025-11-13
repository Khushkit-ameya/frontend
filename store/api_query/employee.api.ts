import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const EmployeeApi = createApi({
    reducerPath: 'employee_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['employee'],
    endpoints: (builder) => ({
        getEmployees: builder.query({
            query: (params) => ({
                url: `employees${params ? '?' + new URLSearchParams(params).toString() : ''}`,
                method: 'GET',
            }),
            providesTags: ['employee']
        }),
        getEmployeeById: builder.query({
            query: (id) => ({
                url: `employees/${id}`,
                method: 'GET',
            }),
            providesTags: ['employee']
        }),
        createEmployee: builder.mutation({
            query: (employeeData) => ({
                url: 'employees',
                method: 'POST',
                body: employeeData,
            }),
            invalidatesTags: ['employee'],
        }),
        updateEmployee: builder.mutation({
            query: ({ id, ...employeeData }) => ({
                url: `employees/${id}`,
                method: 'PUT',
                body: employeeData,
            }),
            invalidatesTags: ['employee'],
        }),
        deleteEmployee: builder.mutation({
            query: (id) => ({
                url: `employees/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['employee'],
        }),
    }),
});

export const {
    useGetEmployeesQuery,
    useGetEmployeeByIdQuery,
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
    useDeleteEmployeeMutation,
} = EmployeeApi;

export default EmployeeApi;
