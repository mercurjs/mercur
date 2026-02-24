import {
  ClientError,
  InferClientInput,
  InferClientOutput,
} from "@mercurjs/client";

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const PAYOUTS_QUERY_KEY = "payouts" as const;
export const payoutsQueryKeys = queryKeysFactory(PAYOUTS_QUERY_KEY);

export const usePayouts = (
  query?: InferClientInput<typeof sdk.vendor.payouts.query>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.payouts.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: payoutsQueryKeys.list(query),
    queryFn: async () => sdk.vendor.payouts.query({ ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePayout = (
  id: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<
    unknown,
    ClientError,
    InferClientOutput<typeof sdk.vendor.payouts.$id.query>
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: payoutsQueryKeys.detail(id, query),
    queryFn: async () => sdk.vendor.payouts.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};
