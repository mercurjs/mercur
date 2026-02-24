import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk, fetchQuery } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { customerGroupsQueryKeys } from "./customer-groups";
import { productsQueryKeys } from "./products";

const PRICE_LISTS_QUERY_KEY = "price-lists" as const;
const PRICE_LIST_PRICES_QUERY_KEY = "price-list-prices" as const;

export const priceListsQueryKeys = queryKeysFactory(PRICE_LISTS_QUERY_KEY);
export const priceListPricesQueryKeys = queryKeysFactory(
  PRICE_LIST_PRICES_QUERY_KEY
);

export const usePriceList = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.priceLists.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.priceLists.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.priceLists.$id.query({ $id: id, ...query }),
    queryKey: priceListsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePriceLists = (
  query?: InferClientInput<typeof sdk.vendor.priceLists.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.priceLists.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.priceLists.query({ ...query }),
    queryKey: priceListsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreatePriceList = (
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.priceLists.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.priceLists.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.priceLists.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() });

      queryClient.invalidateQueries({ queryKey: customerGroupsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdatePriceList = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.priceLists.$id.mutate>,
    ClientError,
    Omit<InferClientInput<typeof sdk.vendor.priceLists.$id.mutate>, "$id">
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.priceLists.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.details(),
      });

      queryClient.invalidateQueries({ queryKey: customerGroupsQueryKeys.all });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeletePriceList = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.priceLists.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.priceLists.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePriceListPrices = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.priceLists.$id.prices.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.priceLists.$id.prices.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.priceLists.$id.prices.query({ $id: id, ...query }),
    queryKey: priceListPricesQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useBatchPriceListPrices = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.priceLists.$id.prices.batch.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.priceLists.$id.prices.batch.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.priceLists.$id.prices.batch.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: priceListPricesQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePriceListLinkProducts = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.priceLists.$id.products.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.priceLists.$id.products.mutate>,
      "$id"
    >
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.vendor.priceLists.$id.products.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: priceListsQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: priceListsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const usePriceListProducts = (
  id: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.products.query({ price_list_id: [id], ...query }),
    queryKey: [PRICE_LISTS_QUERY_KEY, id, "products"],
    ...options,
  });

  return { ...data, ...rest };
};
