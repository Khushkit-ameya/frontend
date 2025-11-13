import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASEURL } from '../baseUrl';

const SalesOrdersApi = createApi({
  reducerPath: 'sales_orders_api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASEURL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['sales_orders', 'sales_order_by_quotation'],
  endpoints: (builder) => ({
    createFromQuotation: builder.mutation<unknown, { quotationId: string; paymentPlan?: Record<string, unknown> }>({
      query: ({ quotationId, paymentPlan }) => ({
        url: `sales-orders/from-quotation/${quotationId}`,
        method: 'POST',
        body: paymentPlan ? { paymentPlan } : {},
      }),
      invalidatesTags: ['sales_orders', 'sales_order_by_quotation'],
    }),

    getSalesOrderByQuotation: builder.query<unknown, string>({
      query: (quotationId) => ({ url: `sales-orders/by-quotation/${quotationId}`, method: 'GET' }),
      providesTags: (result, error, quotationId) => [{ type: 'sales_order_by_quotation', id: quotationId }],
      transformResponse: (res: unknown) => (typeof res === 'object' && res !== null && 'data' in (res as Record<string, unknown>) ? (res as { data?: unknown }).data ?? res : res),
    }),
  }),
});

export const {
  useCreateFromQuotationMutation,
  useGetSalesOrderByQuotationQuery,
} = SalesOrdersApi;

export default SalesOrdersApi;
