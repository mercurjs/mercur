import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";
import {
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const SUBSCRIPTION_PLANS_QUERY_KEY = "subscription_plans" as const;
export const subscriptionPlansQueryKeys = queryKeysFactory(
  SUBSCRIPTION_PLANS_QUERY_KEY,
);

export const useSubscriptionPlans = (
  query?: InferClientInput<typeof sdk.admin.subscriptionPlans.query>,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.subscriptionPlans.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.subscriptionPlans.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.subscriptionPlans.query({ ...query }),
    queryKey: subscriptionPlansQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useSubscriptionPlan = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.subscriptionPlans.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      InferClientOutput<typeof sdk.admin.subscriptionPlans.$id.query>,
      ClientError,
      InferClientOutput<typeof sdk.admin.subscriptionPlans.$id.query>,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.subscriptionPlans.$id.query({ $id: id, ...query }),
    queryKey: subscriptionPlansQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};
