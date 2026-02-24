import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const PRICE_PREFERENCES_QUERY_KEY = "price-preferences" as const;
export const pricePreferencesQueryKeys = queryKeysFactory(
  PRICE_PREFERENCES_QUERY_KEY
);

export const usePricePreference = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.vendor.pricePreferences.$id.query>,
      "$id"
  >,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.pricePreferences.$id.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.pricePreferences.$id.query({ $id: id, ...query }),
    queryKey: pricePreferencesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePricePreferences = (
  query?: InferClientInput<typeof sdk.vendor.pricePreferences.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.pricePreferences.query>
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.vendor.pricePreferences.query({ ...query }),
    queryKey: pricePreferencesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpsertPricePreference = (
  id?: string | undefined,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.pricePreferences.mutate>,
    ClientError,
    InferClientInput<typeof sdk.vendor.pricePreferences.mutate>
  >
) => {
  return useMutation({
    mutationFn: (payload) => {
      if (id) {
        return sdk.vendor.pricePreferences.$id.mutate({ $id: id, ...payload });
      }
      return sdk.vendor.pricePreferences.mutate(payload);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });
      if (id) {
        queryClient.invalidateQueries({
          queryKey: pricePreferencesQueryKeys.detail(id),
        });
      }

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeletePricePreference = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.pricePreferences.$id.delete>,
    ClientError,
    void
  >
) => {
  return useMutation({
    mutationFn: () => sdk.vendor.pricePreferences.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
