import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";

import { HttpTypes } from "@medusajs/types";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { sdk } from "../../lib/client";
import { ClientError, InferClientInput } from "@mercurjs/client";

const STORE_QUERY_KEY = "store" as const;
export const storeQueryKeys = queryKeysFactory(STORE_QUERY_KEY);

export async function retrieveActiveStore(
  query?: InferClientInput<typeof sdk.vendor.stores.query>,
): Promise<HttpTypes.AdminStoreResponse> {
  const response = await sdk.vendor.stores.query({ ...query });

  const activeStore = response.stores?.[0] as HttpTypes.AdminStore;

  if (!activeStore) {
    throw new ClientError("No active store found", "Not Found", 404);
  }

  return { store: activeStore };
}

export const useStore = (
  query?: InferClientInput<typeof sdk.vendor.stores.query>,
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
