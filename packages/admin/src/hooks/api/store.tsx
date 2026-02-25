import { ClientError, InferClientInput, InferClientOutput } from "@mercurjs/client";
import type { HttpTypes } from "@medusajs/types";

import type {
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useMutation, useQuery, UseMutationOptions } from "@tanstack/react-query";

import type { AdminStoreListResponse } from "@custom-types/store";

import { sdk } from "@/lib/client";
import { queryClient } from "@/lib/query-client";
import { queryKeysFactory } from "@/lib/query-key-factory";

import { pricePreferencesQueryKeys } from "./price-preferences";

const STORE_QUERY_KEY = "store" as const;
export const storeQueryKeys = queryKeysFactory(STORE_QUERY_KEY);

/**
 * Workaround to keep the V1 version of retrieving the store.
 */
export async function retrieveActiveStore(
  query?: HttpTypes.AdminStoreParams,
): Promise<HttpTypes.AdminStoreResponse> {
  const response = await sdk.admin.stores.query(query);

  const activeStore = (response as any).stores?.[0];

  if (!activeStore) {
    throw new ClientError("No active store found", "Not Found", 404);
  }

  return { store: activeStore };
}

export const useStore = (
  query?: HttpTypes.SelectParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStoreResponse,
      ClientError,
      HttpTypes.AdminStoreResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => retrieveActiveStore(query),
    queryKey: storeQueryKeys.details(),
    ...options,
  });

  return {
    ...data,
    ...rest,
  };
};

export const useUpdateStore = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.admin.stores.$id.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.admin.stores.$id.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.stores.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.details(),
      });
      queryClient.invalidateQueries({ queryKey: storeQueryKeys.details() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useStores = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<unknown, Error, AdminStoreListResponse, QueryKey>,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...other } = useQuery({
    queryKey: storeQueryKeys.list(query),
    queryFn: () =>
      sdk.client.fetch("/admin/stores", {
        method: "GET",
        query,
      }),
    ...options,
  });

  return { ...data, ...other };
};
