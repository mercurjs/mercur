import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"

import { client } from "../../lib/client"
import type { AdminPayoutJobRunResponse } from "../../../types/http"

export const stripeStatusKeys = queryKeysFactory("admin_stripe_status")
export const stripeJobKeys = queryKeysFactory("admin_stripe_jobs")
export const stripeAccountKeys = queryKeysFactory("admin_stripe_accounts")
export const stripeTransferKeys = queryKeysFactory("admin_stripe_transfers")
export const stripePayoutKeys = queryKeysFactory("admin_stripe_payouts")
export const stripeSettlementKeys = queryKeysFactory("admin_stripe_settlements")
export const stripeAdjustmentKeys = queryKeysFactory("admin_stripe_adjustments")
export const stripeCaptureKeys = queryKeysFactory("admin_stripe_captures")
export const stripeNotificationKeys = queryKeysFactory("admin_stripe_notifications")

type QueryOptions<T> = Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn">
type ListQuery = Record<string, unknown> & { limit?: number; offset?: number }

const invalidateAll = async (qc: ReturnType<typeof useQueryClient>) => {
  await Promise.all(
    [
      stripeStatusKeys,
      stripeJobKeys,
      stripeAccountKeys,
      stripeTransferKeys,
      stripePayoutKeys,
      stripeSettlementKeys,
      stripeAdjustmentKeys,
      stripeCaptureKeys,
      stripeNotificationKeys,
    ].map((keys) => qc.invalidateQueries({ queryKey: keys.all }))
  )
}

export const useStripeStatus = (options?: QueryOptions<Awaited<ReturnType<typeof client.admin["payout-status"]["query"]>>>) =>
  useQuery({ queryKey: stripeStatusKeys.all, queryFn: () => client.admin["payout-status"].query({}), ...options })

export const useStripeJobs = () =>
  useQuery({ queryKey: stripeJobKeys.all, queryFn: () => client.admin["payout-jobs"].query({}) })

export const useStripeJobRuns = (job: string, query: ListQuery = {}) =>
  useQuery({
    queryKey: stripeJobKeys.list({ job, ...query }),
    queryFn: () => client.admin["payout-jobs"].$job.runs.query({ $job: job, ...query }),
  })

export const useRunStripeJob = (
  options?: UseMutationOptions<AdminPayoutJobRunResponse, Error, { job: string; body?: Record<string, string> }>
) => {
  const qc = useQueryClient()
  return useMutation<AdminPayoutJobRunResponse, Error, { job: string; body?: Record<string, string> }>({
    mutationFn: ({ job, body }) => client.admin["payout-jobs"].$job.run.mutate({ $job: job, ...(body ?? {}) }),
    ...options,
    onSuccess: async (data, variables, context) => {
      await invalidateAll(qc)
      await options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useStripeAccounts = (query: ListQuery = {}, options?: QueryOptions<Awaited<ReturnType<typeof client.admin["payout-accounts"]["query"]>>>) =>
  useQuery({
    queryKey: stripeAccountKeys.list(query),
    queryFn: () => client.admin["payout-accounts"].query(query),
    ...options,
  })

export const useAccountAction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, ignored }: { id: string; action: "sync" | "refresh-link" | "ignore"; ignored?: boolean }) => {
      const node = client.admin["payout-accounts"].$id
      if (action === "ignore") return node.ignore.mutate({ $id: id, ignored: !!ignored })
      if (action === "sync") return node.sync.mutate({ $id: id })
      return node["refresh-link"].mutate({ $id: id })
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export const useMapAccount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { seller_id: string; provider_id: string; provider_account_id: string }) =>
      client.admin["payout-accounts"].mutate(body),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useStripeTransfers = (query: ListQuery = {}, options?: QueryOptions<Awaited<ReturnType<typeof client.admin.transfers.query>>>) =>
  useQuery({ queryKey: stripeTransferKeys.list(query), queryFn: () => client.admin.transfers.query(query), ...options })

export const useRetryTransfer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.admin.transfers.$id.retry.mutate({ $id: id }),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useStripePayouts = (query: ListQuery = {}, options?: QueryOptions<Awaited<ReturnType<typeof client.admin.payouts.query>>>) =>
  useQuery({ queryKey: stripePayoutKeys.list(query), queryFn: () => client.admin.payouts.query(query), ...options })

export const useRetryPayout = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => client.admin.payouts.$id.retry.mutate({ $id: id }),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useStripeSettlements = (query: ListQuery = {}, options?: QueryOptions<Awaited<ReturnType<typeof client.admin.settlements.query>>>) =>
  useQuery({ queryKey: stripeSettlementKeys.list(query), queryFn: () => client.admin.settlements.query(query), ...options })

export const useStripeSettlement = (id: string | null) =>
  useQuery({
    queryKey: stripeSettlementKeys.detail(id ?? ""),
    queryFn: () => client.admin.settlements.$id.query({ $id: id as string }),
    enabled: !!id,
  })

export const useStripeAdjustments = (query: ListQuery = {}) =>
  useQuery({ queryKey: stripeAdjustmentKeys.list(query), queryFn: () => client.admin["payout-adjustments"].query(query) })

export const useCreateAdjustment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { seller_id?: string; account_id?: string; type: string; amount: number; currency_code: string; reason?: string | null }) =>
      client.admin["payout-adjustments"].mutate(body),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useStripeCaptures = (query: ListQuery = {}) =>
  useQuery({ queryKey: stripeCaptureKeys.list(query), queryFn: () => client.admin["payout-captures"].query(query) })

export const useCaptureAction = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, action }: { groupId: string; action: "capture" | "cancel" }) =>
      client.admin["payout-captures"].$order_group_id[action].mutate({ $order_group_id: groupId }),
    onSuccess: () => invalidateAll(qc),
  })
}

export const useStripeNotifications = (query: ListQuery = {}) =>
  useQuery({ queryKey: stripeNotificationKeys.list(query), queryFn: () => client.admin["payout-notifications"].query(query) })

export const useSendTestNotification = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => client.admin["payout-notifications"].test.mutate({}),
    onSuccess: () => invalidateAll(qc),
  })
}
