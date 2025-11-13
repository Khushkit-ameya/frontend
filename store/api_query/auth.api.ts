import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  CompanySignupRequest,
  CompanySignupResponse,
  User 
} from '../../types/api.types';

// Custom baseQuery to intercept 401 and clear user
const rawBaseQuery = fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
        headers.set('Accept', 'application/json');
        return headers;
    },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error && (result.error as { status?: number })?.status === 401) {
        try {
            const { clearUser } = await import('../api_query/global');
            api.dispatch(clearUser());
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                // Do NOT redirect while user is already on public auth pages
                const isPublicAuthPage = path === '/login' || path === '/signup';
                if (!isPublicAuthPage) {
                    window.location.href = '/login';
                }
            }
        } catch {}
    }
    return result;
};

const AuthApi = createApi({
        reducerPath: 'auth_api',
        baseQuery: baseQueryWithReauth,
    tagTypes: ['auth'],
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginRequest>({
            query: (credentials) => ({
                url: 'auth/login',
                method: 'POST',
                body: credentials,
            }),
            invalidatesTags: ['auth'],
        }),
    logout: builder.mutation<{ success: boolean }, void>({
            query: () => ({
                url: 'auth/logout',
                method: 'POST',
            }),
            invalidatesTags: ['auth'],
        }),
        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: ({ name, email, password }) => ({
                url: 'auth/register',
                method: 'POST',
                body: { name, email, password },
            }),
            invalidatesTags: ['auth'],
        }),
        companySignup: builder.mutation<CompanySignupResponse, CompanySignupRequest>({
            query: (data) => ({
                url: 'auth/company-signup',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['auth'],
        }),
        getCurrentUser: builder.query<User | null, void>({
            query: () => ({
                url: 'auth/me',
                method: 'GET',
            }),
            transformResponse: (response: { user?: User } | null | undefined) => response?.user || null,
            providesTags: ['auth'],
        }),
        forgotPassword: builder.mutation<{ message: string }, { email: string }>({
            query: (data) => ({
                url: 'auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),
        resetPassword: builder.mutation<{ message: string }, { token: string; password: string }>({
            query: ({ token, password }) => ({
                url: 'auth/reset-password',
                method: 'POST',
                body: { token, password },
            }),
        }),
        refreshToken: builder.mutation<{ token: string }, void>({
            query: () => ({
                url: 'auth/refresh',
                method: 'POST',
            }),
        }),
        getCompanyUsers: builder.query<{ success: boolean; users: unknown[] }, { role?: string }>({
            query: ({ role } = {}) => ({
                url: `auth/company-users${role ? `?role=${role}` : ''}`,
                method: 'GET',
            }),
            providesTags: ['auth'],
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
    useCompanySignupMutation,
    useGetCurrentUserQuery,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useRefreshTokenMutation,
    useGetCompanyUsersQuery,
} = AuthApi;

export default AuthApi;
