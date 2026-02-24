import { MutationOptions, useMutation, useQuery } from "@tanstack/react-query";

import { HttpTypes } from "@medusajs/types";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { pricePreferencesQueryKeys } from "./price-preferences";
import { fetchQuery, sdk } from "../../lib/client";
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
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => retrieveActiveStore(query),
    queryKey: storeQueryKeys.details(),
  });

  return {
    ...data,
    ...rest,
  };
};

export const useUpdateStore = (
  id: string,
  options?: MutationOptions<
    HttpTypes.AdminStoreResponse,
    ClientError,
    HttpTypes.AdminUpdateStore
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/sellers/me", { method: "POST", body: payload }),
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
