import { ClientError, InferClientOutput } from "@mercurjs/client";
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";

const PAYOUT_ACCOUNTS_QUERY_KEY = "payout_accounts" as const;
export const payoutAccountsQueryKeys = queryKeysFactory(PAYOUT_ACCOUNTS_QUERY_KEY);

type MyPayoutAccountResponse = InferClientOutput<typeof sdk.vendor.payoutAccounts.me.query>;

export const useMyPayoutAccount = (
  options?: Omit<
    UseQueryOptions<MyPayoutAccountResponse, ClientError, MyPayoutAccountResponse>,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: payoutAccountsQueryKeys.detail("me"),
    queryFn: async () => sdk.vendor.payoutAccounts.me.query({}),
    ...options,
  });

  return { ...data, ...rest };
};

type OnboardingResponse = InferClientOutput<
  typeof sdk.vendor.payoutAccounts.$id.onboarding.mutate
>;

export const useCreatePayoutOnboarding = (
  accountId: string,
  options?: UseMutationOptions<OnboardingResponse, ClientError, void>,
) => {
  return useMutation({
    mutationFn: async () =>
      sdk.vendor.payoutAccounts.$id.onboarding.mutate({ $id: accountId }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: payoutAccountsQueryKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
