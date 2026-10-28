import type { ClientError } from "@mercurjs/client"
import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { client, type VendorAccount } from "../../lib/client"
import type {
  VendorPayoutAccountMeResponse,
  VendorSettlementListResponse,
} from "../../../types/http"

export const vendorStripeKeys = queryKeysFactory("vendor_stripe")
const payoutAccountsQueryKeys = queryKeysFactory("payout_accounts")

export const useMyStripeAccount = (
  options?: Omit<
    UseQueryOptions<VendorPayoutAccountMeResponse, ClientError, VendorPayoutAccountMeResponse>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: vendorStripeKeys.detail("me"),
    queryFn: () => client.vendor["payout-accounts"].me.query({}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useMySettlements = (
  query: Record<string, unknown> = {},
  options?: Omit<
    UseQueryOptions<VendorSettlementListResponse, ClientError, VendorSettlementListResponse>,
    "queryKey" | "queryFn"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: vendorStripeKeys.list({ kind: "settlements", ...query }),
    queryFn: () => client.vendor.stripe.settlements.query(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateMyAccount = (
  options?: UseMutationOptions<{ payout_account: VendorAccount }, ClientError, Record<string, unknown>>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: (data) => client.vendor["payout-accounts"].mutate({ data, context: {} }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: vendorStripeKeys.all })
      queryClient.invalidateQueries({ queryKey: payoutAccountsQueryKeys.all })
      options?.onSuccess?.(data, variables, context)
    },
  })
}
