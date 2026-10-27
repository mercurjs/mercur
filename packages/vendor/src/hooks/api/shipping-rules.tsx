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
import { shippingOptionsQueryKeys } from "./shipping-options";
import { stockLocationsQueryKeys } from "./stock-locations";

const SHIPPING_RULES_QUERY_KEY = "shipping_rules" as const;
export const shippingRulesQueryKeys = queryKeysFactory(
  SHIPPING_RULES_QUERY_KEY,
);

type ShippingRulesQuery = InferClientInput<typeof sdk.vendor.shippingRules.query>;

export const useShippingRules = (
  query?: Partial<ShippingRulesQuery>,
  options?: Omit<
    UseQueryOptions<
      unknown,
      ClientError,
      InferClientOutput<typeof sdk.vendor.shippingRules.query>
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.vendor.shippingRules.query({ ...query } as ShippingRulesQuery),
    queryKey: shippingRulesQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useEnableShippingRule = (
  id: string,
  options?: UseMutationOptions<
    InferClientOutput<typeof sdk.vendor.shippingRules.$id.enable.mutate>,
    ClientError,
    Omit<
      InferClientInput<typeof sdk.vendor.shippingRules.$id.enable.mutate>,
      "$id"
    >
  >,
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) =>
      sdk.vendor.shippingRules.$id.enable.mutate({ $id: id, ...payload }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: shippingRulesQueryKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: shippingOptionsQueryKeys.all,
      });
      await queryClient.invalidateQueries({
        queryKey: stockLocationsQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
  });
};
