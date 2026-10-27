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
import { PayoutDTO, PayoutReversalDTO } from "@mercurjs/types";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const PAYOUTS_QUERY_KEY = "payouts" as const;
export const payoutsQueryKeys = queryKeysFactory(PAYOUTS_QUERY_KEY);

type PayoutSeller = { id: string; name: string | null; handle: string | null };

export type AdminPayout = PayoutDTO & {
  reversals?: PayoutReversalDTO[];
  seller?: PayoutSeller | null;
  account?: {
    id: string;
    status: string;
    seller?: PayoutSeller | null;
  } | null;
};

type PayoutResponse = { payout: AdminPayout };

type PayoutListResponse = Omit<
  InferClientOutput<typeof sdk.admin.payouts.query>,
  "payouts"
> & { payouts: AdminPayout[] };

export const usePayout = (
  id: string,
  query?: Omit<InferClientInput<typeof sdk.admin.payouts.$id.query>, "$id">,
  options?: Omit<
    UseQueryOptions<PayoutResponse, ClientError, PayoutResponse, QueryKey>,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payouts.$id.query({
        $id: id,
        ...query,
      }) as Promise<PayoutResponse>,
    queryKey: payoutsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const usePayouts = (
  query?: InferClientInput<typeof sdk.admin.payouts.query>,
  options?: Omit<
    UseQueryOptions<
      PayoutListResponse,
      ClientError,
      PayoutListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payouts.query({ ...query }) as Promise<PayoutListResponse>,
    queryKey: payoutsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRetryPayout = (
  id: string,
  options?: UseMutationOptions<PayoutResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.payouts.$id.retry.mutate({
        $id: id,
      }) as Promise<PayoutResponse>,
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: payoutsQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: payoutsQueryKeys.detail(id),
        }),
      ]);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
