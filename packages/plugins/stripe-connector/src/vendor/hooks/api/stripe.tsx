import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { client } from "../../lib/client"

export const vendorStripeKeys = queryKeysFactory("vendor_stripe")

export const useMyStripeAccount = () =>
  useQuery({ queryKey: vendorStripeKeys.detail("me"), queryFn: () => client.vendor["payout-accounts"].me.query({}) })

export const useMySettlements = (query: Record<string, unknown> = {}) =>
  useQuery({ queryKey: vendorStripeKeys.list({ kind: "settlements", ...query }), queryFn: () => client.vendor.stripe.settlements.query(query) })

export const useMyPayouts = (query: Record<string, unknown> = {}) =>
  useQuery({ queryKey: vendorStripeKeys.list({ kind: "payouts", ...query }), queryFn: () => client.vendor.payouts.query(query) })

export const useCreateMyAccount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => client.vendor["payout-accounts"].mutate({ data, context: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorStripeKeys.all }),
  })
}

export const useRefreshMyOnboarding = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => client.vendor["payout-accounts"].$id.onboarding.mutate({ $id: accountId, data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorStripeKeys.all }),
  })
}
