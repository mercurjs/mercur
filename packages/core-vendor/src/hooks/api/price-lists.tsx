import { FetchError } from '@medusajs/js-sdk';
import { HttpTypes } from '@medusajs/types';
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';

import { fetchQuery, sdk } from '../../lib/client';
import { queryClient } from '../../lib/query-client';
import { queryKeysFactory } from '../../lib/query-key-factory';
import { ExtendedPriceList, PriceListListResponse } from '../../types/price-list';
import { customerGroupsQueryKeys } from './customer-groups';
import { productsQueryKeys } from './products';

const PRICE_LISTS_QUERY_KEY = 'price-lists' as const;
export const priceListsQueryKeys = queryKeysFactory(PRICE_LISTS_QUERY_KEY);

export const usePriceList = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<HttpTypes.AdminPriceListResponse, FetchError, any, QueryKey>,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/price-lists/${id}`, {
        method: 'GET',
        query
      }),
    queryKey: priceListsQueryKeys.detail(id),
    ...options
  });

  return { ...data, ...rest };
};

export const usePriceListProducts = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<HttpTypes.AdminPriceListResponse, FetchError, any, QueryKey>,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/vendor/price-lists/${id}/products`, {
        method: 'GET',
        query
      }),
    queryKey: [PRICE_LISTS_QUERY_KEY, id, 'products'],
    ...options
  });

  return { ...data, ...rest };
};

export const usePriceLists = (
  query?: HttpTypes.AdminPriceListListParams,
  options?: Omit<
    UseQueryOptions<PriceListListResponse, FetchError, PriceListListResponse, QueryKey>,
    'queryKey' | 'queryFn'
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery('/vendor/price-lists', {
        method: 'GET',
        query: query as { [key: string]: string | number }
      }),
    queryKey: priceListsQueryKeys.list(query),
    ...options
  });

  const price_lists: ExtendedPriceList[] = data?.price_lists || [];

  const count = data?.count || price_lists?.length;

  return { ...data, price_lists, count, ...rest };
};

export const useCreatePriceList = (
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminCreatePriceList
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery('/vendor/price-lists', {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.lists()
      });

      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.all
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useUpdatePriceList = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminUpdatePriceList
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery(`/vendor/price-lists/${id}`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.details()
      });

      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.all
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useDeletePriceList = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminPriceListDeleteResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () =>
      fetchQuery(`/vendor/price-lists/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.lists()
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const useBatchPriceListPrices = (
  id: string,
  query?: HttpTypes.AdminPriceListParams,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListBatchResponse,
    FetchError,
    HttpTypes.AdminBatchPriceListPrice
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.priceList.batchPrices(id, payload, query),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists()
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};

export const usePriceListLinkProducts = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminPriceListResponse,
    FetchError,
    HttpTypes.AdminLinkPriceListProducts & { create?: any[]; update?: any[] }
  >
) => {
  return useMutation({
    mutationFn: payload =>
      fetchQuery(`/vendor/price-lists/${id}/products`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.lists()
      });
      queryClient.invalidateQueries({
        queryKey: [PRICE_LISTS_QUERY_KEY, id, 'products']
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options
  });
};
