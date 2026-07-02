'use server';

import { HttpTypes } from '@medusajs/types';

import { SellerProps } from '@/types/seller';

import { mercur } from '../mercur';
import { sdk } from '../config';
import medusaError from '../helpers/medusa-error';
import { getAuthHeaders, getCacheOptions } from './cookies';

export const retrieveOrderGroup = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  return mercur.store.orderGroups.$id
    .query({ $id: id, fetchOptions: { headers, cache: 'no-cache' } })
    .then(({ order_group }) => order_group as unknown as StoreOrderGroup)
    .catch(err => medusaError(err));
};

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('orders'))
  };

  return mercur.store.orders.$id
    .query({
      $id: id,
      fields:
        '*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product,*seller,*order_group',
      fetchOptions: { headers, next, cache: 'force-cache' }
    })
    .then(({ order }) => order as HttpTypes.StoreOrder & { seller: SellerProps })
    .catch(err => medusaError(err));
};

export const createReturnRequest = async (data: any) => {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string
  };

  const response = await fetch(`${process.env.MEDUSA_BACKEND_URL}/store/return-request`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
    .then(async res => await res.json())
    .catch(err => medusaError(err));

  return response;
};

export const getReturns = async () => {
  const headers = await getAuthHeaders();

  return sdk.client
    .fetch<{
      order_return_requests: Array<any>;
    }>(`/store/return-request`, {
      method: 'GET',
      headers,
      cache: 'force-cache',
      query: { fields: '*line_items.reason_id' }
    })
    .then(res => res)
    .catch(err => medusaError(err));
};

export const retriveReturnMethods = async (order_id: string) => {
  const headers = await getAuthHeaders();

  return sdk.client
    .fetch<{
      shipping_options: Array<any>;
    }>(`/store/shipping-options/return?order_id=${order_id}`, {
      method: 'GET',
      headers,
      cache: 'no-cache'
    })
    .then(({ shipping_options }) => shipping_options)
    .catch(() => []);
};

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('orders'))
  };

  return mercur.store.orders
    .query({
      limit,
      offset,
      order: '-created_at',
      fields:
        '*items,+items.metadata,*items.variant,*items.product,*seller,*reviews,*order_group,shipping_total,total,created_at',
      ...filters,
      fetchOptions: { headers, next, cache: 'no-cache' }
    } as Parameters<typeof mercur.store.orders.query>[0])
    .then(({ orders }) =>
      (
        orders as Array<
          HttpTypes.StoreOrder & {
            seller: { id: string; name: string; reviews?: any[] };
            reviews: any[];
            order_group: { id: string };
          }
        >
      ).filter(order => order.order_group)
    )
    .catch(err => medusaError(err));
};

export type StoreOrderGroup = {
  id: string;
  display_id: number;
  created_at: string;
  total: number;
  currency_code?: string;
  orders: Array<
    HttpTypes.StoreOrder & {
      seller: { id: string; name: string };
    }
  >;
};

export const listOrderGroups = async (
  limit: number = 50,
  offset: number = 0
): Promise<StoreOrderGroup[]> => {
  const headers = {
    ...(await getAuthHeaders())
  };

  const next = {
    ...(await getCacheOptions('orders'))
  };

  return mercur.store.orderGroups
    .query({
      limit,
      offset,
      order: '-created_at',
      fetchOptions: { headers, next, cache: 'no-cache' }
    } as Parameters<typeof mercur.store.orderGroups.query>[0])
    .then(({ order_groups }) => order_groups as unknown as StoreOrderGroup[])
    .catch(err => medusaError(err));
};

export const createTransferRequest = async (
  state: {
    success: boolean;
    error: string | null;
    order: HttpTypes.StoreOrder | null;
  },
  formData: FormData
): Promise<{
  success: boolean;
  error: string | null;
  order: HttpTypes.StoreOrder | null;
}> => {
  const id = formData.get('order_id') as string;

  if (!id) {
    return { success: false, error: 'Order ID is required', order: null };
  }

  const headers = await getAuthHeaders();

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: 'id, email'
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders();

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders();

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch(err => ({ success: false, error: err.message, order: null }));
};

export const retrieveReturnReasons = async () => {
  const headers = await getAuthHeaders();

  return mercur.store.returnReasons
    .query({ fetchOptions: { headers, cache: 'force-cache' } })
    .then(({ return_reasons }) => return_reasons)
    .catch(err => medusaError(err));
};
