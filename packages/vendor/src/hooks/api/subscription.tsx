import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const SUBSCRIPTION_QUERY_KEY = "subscription" as const;
export const subscriptionQueryKeys = queryKeysFactory(SUBSCRIPTION_QUERY_KEY);

export const useSubscription = (
  query?: InferClientInput<typeof sdk.vendor.subscription.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.vendor.subscription.query>,
      ClientError
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: subscriptionQueryKeys.details(),
    queryFn: () => sdk.vendor.subscription.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};
