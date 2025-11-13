import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const UserApi = createApi({
    reducerPath: 'user_api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASEURL,
        credentials: 'include',
        prepareHeaders: (headers) => {
            headers.set('Accept', 'application/json');
            return headers;
        },
    }),
    tagTypes: ['user'],
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: () => ({
                url: 'users',
                method: 'GET',
            }),
            providesTags: ['user']
        }),
        getUserById: builder.query({
            query: (id) => ({
                url: `users/${id}`,
                method: 'GET',
            }),
            providesTags: ['user']
        }),
        createUser: builder.mutation({
            query: (userData) => ({
                url: 'users',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['user'],
        }),
        updateUser: builder.mutation({
            query: ({ id, ...userData }) => ({
                url: `users/${id}`,
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['user'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['user'],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = UserApi;

export default UserApi;
