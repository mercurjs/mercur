import {
  ClientError,
  InferClientInput,
} from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { AdminPayoutAccount } from "../../lib/payouts";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

export type { AdminPayoutAccount };

const PAYOUT_ACCOUNTS_QUERY_KEY = "payout_accounts" as const;
export const payoutAccountsQueryKeys = queryKeysFactory(
  PAYOUT_ACCOUNTS_QUERY_KEY,
);


type PayoutAccountResponse = { payout_account: AdminPayoutAccount };

export const usePayoutAccount = (
  id: string,
  query?: Omit<
    InferClientInput<typeof sdk.admin.payoutAccounts.$id.query>,
    "$id"
  >,
  options?: Omit<
    UseQueryOptions<
      PayoutAccountResponse,
      ClientError,
      PayoutAccountResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payoutAccounts.$id.query({
        $id: id,
        ...query,
      }) as Promise<PayoutAccountResponse>,
    queryKey: payoutAccountsQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};

type PayoutAccountListResponse = {
  payout_accounts: AdminPayoutAccount[];
  count: number;
  offset: number;
  limit: number;
};

export const usePayoutAccounts = (
  query?: InferClientInput<typeof sdk.admin.payoutAccounts.query>,
  options?: Omit<
    UseQueryOptions<
      PayoutAccountListResponse,
      ClientError,
      PayoutAccountListResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      sdk.admin.payoutAccounts.query({
        ...query,
      }) as Promise<PayoutAccountListResponse>,
    queryKey: payoutAccountsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

const invalidate = (id: string) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: payoutAccountsQueryKeys.lists(),
    }),
    queryClient.invalidateQueries({
      queryKey: payoutAccountsQueryKeys.detail(id),
    }),
  ]);

export const useSyncPayoutAccount = (
  id: string,
  options?: UseMutationOptions<PayoutAccountResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.payoutAccounts.$id.sync.mutate({
        $id: id,
      }) as Promise<PayoutAccountResponse>,
    onSuccess: async (data, variables, context) => {
      await invalidate(id);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRefreshPayoutAccountLink = (
  id: string,
  options?: UseMutationOptions<PayoutAccountResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.payoutAccounts.$id.refreshLink.mutate({
        $id: id,
      }) as Promise<PayoutAccountResponse>,
    onSuccess: async (data, variables, context) => {
      await invalidate(id);
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
