import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

export type PaymentListQuery = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  customerId?: string;
  opportunityId?: string;
  dealId?: string;
  status?: string;
  paymentType?: string;
  paymentInterval?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  assignedToId?: string;
  overdue?: boolean;
  savedFilterId?: string;
  // dynamic field filters (e.g., createdBy, assignedTo, etc.)
  [key: string]: unknown;
};

export type CalculatePaymentBody = {
  subtotal: number;
  discountType?: 'none' | 'percentage' | 'fixed';
  discountValue?: number;
  taxType?: 'none' | 'percentage' | 'fixed';
  taxValue?: number;
  gstType?: 'none' | 'inclusive' | 'exclusive';
  gstRate?: number;
  isInterstate?: boolean;
};

export type CreatePaymentBody = Record<string, unknown> & {
  paymentName: string;
  subtotal: number;
  paymentType: string;
  paymentInterval: string;
  startDate: string;
};

export type UpdatePaymentBody = Partial<CreatePaymentBody> & Record<string, unknown>;

const PaymentsApi = createApi({
  reducerPath: 'payments_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'payments',
    'payment_updates',
    'payment_reminders',
    'payment_analytics'
  ],
  endpoints: (builder) => ({
    // List and filter
    getPayments: builder.query<unknown, PaymentListQuery | void>({
      query: (params) => ({ url: 'api/payments', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      providesTags: ['payments'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),
    filterPayments: builder.mutation<unknown, PaymentListQuery>({
      query: (params) => ({ url: 'api/payments', method: 'GET', params: (params ?? {}) as Record<string, string | number | boolean | undefined> }),
      invalidatesTags: ['payments'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    // Single
    getPayment: builder.query<unknown, string>({
      query: (paymentId) => ({ url: `api/payments/${paymentId}`, method: 'GET' }),
      providesTags: (result, error, paymentId) => [ { type: 'payments' as const, id: paymentId } ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Create for a customer
    createPayment: builder.mutation<unknown, { customerId: string; data: CreatePaymentBody }>({
      query: ({ customerId, data }) => ({ url: `api/payments/customer/${customerId}`, method: 'POST', body: data }),
      invalidatesTags: ['payments'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    updatePayment: builder.mutation<unknown, { paymentId: string; data: UpdatePaymentBody }>({
      query: ({ paymentId, data }) => ({ url: `api/payments/${paymentId}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { paymentId }) => [ 'payments', { type: 'payments' as const, id: paymentId } ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    deletePayment: builder.mutation<void, string>({
      query: (paymentId) => ({ url: `api/payments/${paymentId}`, method: 'DELETE' }),
      invalidatesTags: ['payments'],
    }),

    // Calculations & breakdown
    calculatePayment: builder.mutation<unknown, CalculatePaymentBody>({
      query: (body) => ({ url: 'api/payments/calculate', method: 'POST', body }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    recalculatePayment: builder.mutation<unknown, { paymentId: string; data: Record<string, unknown> }>({
      query: ({ paymentId, data }) => ({ url: `api/payments/${paymentId}/recalculate`, method: 'POST', body: data }),
      invalidatesTags: (result, error, { paymentId }) => [ 'payments', { type: 'payments' as const, id: paymentId } ],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),

    getPaymentBreakdown: builder.query<unknown, string>({
      query: (paymentId) => ({ url: `api/payments/${paymentId}/breakdown`, method: 'GET' }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    getPaymentInvoice: builder.query<unknown, { paymentId: string; format?: 'json' | 'pdf' }>({
      query: ({ paymentId, format = 'json' }) => ({ url: `api/payments/${paymentId}/invoice`, method: 'GET', params: { format } }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    // Analytics
    getPaymentsAnalytics: builder.query<unknown, { startDate?: string; endDate?: string; customerId?: string } | void>({
      query: (params) => ({ url: 'api/payments/analytics', method: 'GET', params: (params ?? {}) as Record<string, string> }),
      providesTags: ['payment_analytics'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    getPaymentsAnalyticsWithTaxes: builder.query<unknown, { startDate?: string; endDate?: string; customerId?: string } | void>({
      query: (params) => ({ url: 'api/payments/analytics-with-taxes', method: 'GET', params: (params ?? {}) as Record<string, string> }),
      providesTags: ['payment_analytics'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),

    // Reminders
    getUpcomingPaymentReminders: builder.query<unknown, number | void>({
      query: (days) => ({ url: 'api/payments/reminders/upcoming', method: 'GET', params: days ? { days } : {} }),
      providesTags: ['payment_reminders'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),
    getOverduePayments: builder.query<unknown, void>({
      query: () => ({ url: 'api/payments/overdue', method: 'GET' }),
      providesTags: ['payments'],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 300,
    }),
    getCustomerPaymentHistory: builder.query<unknown, string>({
      query: (customerId) => ({ url: `api/payments/customer/${customerId}/history`, method: 'GET' }),
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
      keepUnusedDataFor: 600,
    }),

    createPaymentReminder: builder.mutation<unknown, { paymentId: string; data: { reminderDate: string | Date; reminderType: 'email' | 'notification' | 'sms'; message?: string; installmentId?: string } }>({
      query: ({ paymentId, data }) => ({ url: `api/payments/${paymentId}/reminders`, method: 'POST', body: data }),
      invalidatesTags: ['payment_reminders', 'payments'],
    }),
    markPaymentReminderSent: builder.mutation<unknown, string>({
      query: (reminderId) => ({ url: `api/payments/reminders/${reminderId}/mark-sent`, method: 'PUT' }),
      invalidatesTags: ['payment_reminders'],
    }),

    // Payment actions
    payOneTimePayment: builder.mutation<unknown, { paymentId: string; data: { paidAmount?: number; paymentMethod?: string; transactionRef?: string; notes?: string; paidDate?: string | Date } }>({
      query: ({ paymentId, data }) => ({ url: `api/payments/${paymentId}/pay-one-time`, method: 'POST', body: data }),
      invalidatesTags: (result, error, { paymentId }) => [ 'payments', { type: 'payments' as const, id: paymentId } ],
    }),
    recordInstallmentPayment: builder.mutation<unknown, { paymentId: string; installmentId: string; data: { paidAmount: number; paymentMethod?: string; transactionRef?: string; notes?: string; paidById?: string } }>({
      query: ({ paymentId, installmentId, data }) => ({ url: `api/payments/${paymentId}/installments/${installmentId}/pay`, method: 'POST', body: data }),
      invalidatesTags: (result, error, { paymentId }) => [ 'payments', { type: 'payments' as const, id: paymentId } ],
    }),

    // Updates
    getPaymentUpdates: builder.query<unknown, string>({
      query: (paymentId) => ({ url: `api/payments/${paymentId}/updates`, method: 'GET' }),
      providesTags: (result, error, paymentId) => [{ type: 'payment_updates', id: paymentId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
    addPaymentUpdate: builder.mutation<unknown, { paymentId: string; content: string }>({
      query: ({ paymentId, content }) => ({ url: `api/payments/${paymentId}/updates`, method: 'POST', body: { content } }),
      invalidatesTags: (result, error, { paymentId }) => [ { type: 'payment_updates', id: paymentId }, { type: 'payments', id: paymentId } ],
    }),
    editPaymentUpdate: builder.mutation<unknown, { paymentId: string; updateId: string; content: string }>({
      query: ({ paymentId, updateId, content }) => ({ url: `api/payments/${paymentId}/updates/${updateId}`, method: 'PUT', body: { content } }),
      invalidatesTags: (result, error, { paymentId }) => [ { type: 'payment_updates', id: paymentId }, { type: 'payments', id: paymentId } ],
    }),
    deletePaymentUpdate: builder.mutation<unknown, { paymentId: string; updateId: string }>({
      query: ({ paymentId, updateId }) => ({ url: `api/payments/${paymentId}/updates/${updateId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { paymentId }) => [ { type: 'payment_updates', id: paymentId }, { type: 'payments', id: paymentId } ],
    }),

    // Initialize fields
    initializePaymentFields: builder.mutation<unknown, void>({
      query: () => ({ url: 'api/payments/initialize-fields', method: 'POST' }),
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useFilterPaymentsMutation,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
  useCalculatePaymentMutation,
  useRecalculatePaymentMutation,
  useGetPaymentBreakdownQuery,
  useGetPaymentInvoiceQuery,
  useGetPaymentsAnalyticsQuery,
  useGetPaymentsAnalyticsWithTaxesQuery,
  useGetUpcomingPaymentRemindersQuery,
  useGetOverduePaymentsQuery,
  useGetCustomerPaymentHistoryQuery,
  useCreatePaymentReminderMutation,
  useMarkPaymentReminderSentMutation,
  usePayOneTimePaymentMutation,
  useRecordInstallmentPaymentMutation,
  useGetPaymentUpdatesQuery,
  useAddPaymentUpdateMutation,
  useEditPaymentUpdateMutation,
  useDeletePaymentUpdateMutation,
  useInitializePaymentFieldsMutation,
} = PaymentsApi;

export default PaymentsApi;
