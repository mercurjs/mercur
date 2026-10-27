import { queryKeysFactory } from "@mercurjs/dashboard-shared"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"

import { client, type ListQuery, type SellerListResponse } from "../../lib/client"
import type {
  AdminAdjustmentListResponse,
  AdminAdjustmentResponse,
  AdminPayoutAccountListResponse,
  AdminPayoutAccountResponse,
  AdminPayoutCaptureListResponse,
  AdminPayoutCaptureResponse,
  AdminPayoutJobListResponse,
  AdminPayoutJobRunListResponse,
  AdminPayoutJobRunResponse,
  AdminPayoutListResponse,
  AdminPayoutNotificationListResponse,
  AdminPayoutResponse,
  AdminPayoutStatusResponse,
  AdminSettlementListResponse,
  AdminSettlementResponse,
} from "../../../types/http"

export const stripeStatusKeys = queryKeysFactory("admin_stripe_status")
export const stripeJobKeys = queryKeysFactory("admin_stripe_jobs")
export const stripeJobRunKeys = queryKeysFactory("admin_stripe_job_runs")
export const stripeAccountKeys = queryKeysFactory("admin_stripe_accounts")
export const stripePayoutKeys = queryKeysFactory("admin_stripe_payouts")
export const stripeSettlementKeys = queryKeysFactory("admin_stripe_settlements")
export const stripeAdjustmentKeys = queryKeysFactory("admin_stripe_adjustments")
export const stripeCaptureKeys = queryKeysFactory("admin_stripe_captures")
export const stripeNotificationKeys = queryKeysFactory("admin_stripe_notifications")
export const stripeSellerKeys = queryKeysFactory("admin_stripe_sellers")

type QueryOptions<T> = Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn">
type MutationOptions<TData, TVariables = void> = UseMutationOptions<TData, Error, TVariables>

const ACCOUNT_FIELDS = "+seller.name,+seller.metadata,+onboarding.id,+onboarding.data"
const PAYOUT_FIELDS = "+reversals.*,+seller.name,+seller.handle"

// Every Stripe operation can move several entities at once (a capture decides
// payouts, a settlement retry touches adjustments), so mutations refresh them all.
const invalidateStripe = (qc: QueryClient) =>
  Promise.all(
    [
      stripeStatusKeys,
      stripeJobKeys,
      stripeJobRunKeys,
      stripeAccountKeys,
      stripePayoutKeys,
      stripeSettlementKeys,
      stripeAdjustmentKeys,
      stripeCaptureKeys,
      stripeNotificationKeys,
    ].map((keys) => qc.invalidateQueries({ queryKey: keys.all }))
  )

const useStripeMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData, TVariables>
) => {
  const qc = useQueryClient()

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
    onSuccess: async (data, variables, context) => {
      await invalidateStripe(qc)
      await options?.onSuccess?.(data, variables, context)
    },
  })
}

export const useStripeStatus = (options?: QueryOptions<AdminPayoutStatusResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeStatusKeys.all,
    queryFn: () => client.admin.stripe.status.query({}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useStripeJobs = (options?: QueryOptions<AdminPayoutJobListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeJobKeys.lists(),
    queryFn: () => client.admin.stripe.jobs.query({}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useStripeJobRuns = (
  job: string,
  query?: ListQuery,
  options?: QueryOptions<AdminPayoutJobRunListResponse>
) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeJobRunKeys.list({ job, ...query }),
    queryFn: () => client.admin.stripe.jobs.$job.runs.query({ $job: job, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useRunStripeJob = (job: string, options?: MutationOptions<AdminPayoutJobRunResponse>) =>
  useStripeMutation(() => client.admin.stripe.jobs.$job.run.mutate({ $job: job }), options)

export const useStripeAccounts = (query?: ListQuery, options?: QueryOptions<AdminPayoutAccountListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeAccountKeys.list(query),
    queryFn: () => client.admin["payout-accounts"].query({ fields: ACCOUNT_FIELDS, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useStripeAccount = (id: string, options?: QueryOptions<AdminPayoutAccountResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeAccountKeys.detail(id),
    queryFn: () => client.admin["payout-accounts"].$id.query({ $id: id, fields: ACCOUNT_FIELDS }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useSyncStripeAccount = (id: string, options?: MutationOptions<AdminPayoutAccountResponse>) =>
  useStripeMutation(() => client.admin["payout-accounts"].$id.sync.mutate({ $id: id }), options)

export const useRefreshStripeAccountLink = (id: string, options?: MutationOptions<AdminPayoutAccountResponse>) =>
  useStripeMutation(() => client.admin["payout-accounts"].$id["refresh-link"].mutate({ $id: id }), options)

export const useIgnoreStripeAccount = (id: string, options?: MutationOptions<AdminPayoutAccountResponse, boolean>) =>
  useStripeMutation((ignored: boolean) => client.admin.stripe.accounts.$id.ignore.mutate({ $id: id, ignored }), options)

export const useMapStripeAccount = (
  options?: MutationOptions<AdminPayoutAccountResponse, { seller_id: string; external_id: string }>
) => useStripeMutation((body) => client.admin["payout-accounts"].mutate(body), options)

export const useStripePayouts = (query?: ListQuery, options?: QueryOptions<AdminPayoutListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripePayoutKeys.list(query),
    queryFn: () => client.admin.payouts.query({ fields: PAYOUT_FIELDS, ...query }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useRetryPayout = (options?: MutationOptions<AdminPayoutResponse, string>) =>
  useStripeMutation((id: string) => client.admin.payouts.$id.retry.mutate({ $id: id }), options)

export const useStripeSettlements = (query?: ListQuery, options?: QueryOptions<AdminSettlementListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeSettlementKeys.list(query),
    queryFn: () => client.admin.stripe.settlements.query(query ?? {}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useStripeSettlement = (id: string, options?: QueryOptions<AdminSettlementResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeSettlementKeys.detail(id),
    queryFn: () => client.admin.stripe.settlements.$id.query({ $id: id }),
    ...options,
  })

  return { ...data, ...rest }
}

export const useRetrySettlementPayout = (id: string, options?: MutationOptions<AdminSettlementResponse>) =>
  useStripeMutation(() => client.admin.stripe.settlements.$id.retry.mutate({ $id: id }), options)

export const useStripeAdjustments = (query?: ListQuery, options?: QueryOptions<AdminAdjustmentListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeAdjustmentKeys.list(query),
    queryFn: () => client.admin.stripe.adjustments.query(query ?? {}),
    ...options,
  })

  return { ...data, ...rest }
}

export type CreateAdjustmentPayload = {
  seller_id: string
  type: string
  amount: number
  currency_code: string
  reason?: string | null
}

export const useCreateAdjustment = (options?: MutationOptions<AdminAdjustmentResponse, CreateAdjustmentPayload>) =>
  useStripeMutation((body: CreateAdjustmentPayload) => client.admin.stripe.adjustments.mutate(body), options)

export const useStripeCaptures = (query?: ListQuery, options?: QueryOptions<AdminPayoutCaptureListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeCaptureKeys.list(query),
    queryFn: () => client.admin.stripe.captures.query(query ?? {}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCapturePayment = (groupId: string, options?: MutationOptions<AdminPayoutCaptureResponse>) =>
  useStripeMutation(
    () => client.admin.stripe.captures.$order_group_id.capture.mutate({ $order_group_id: groupId }),
    options
  )

export const useCancelPayment = (groupId: string, options?: MutationOptions<AdminPayoutCaptureResponse>) =>
  useStripeMutation(
    () => client.admin.stripe.captures.$order_group_id.cancel.mutate({ $order_group_id: groupId }),
    options
  )

export const useStripeNotifications = (
  query?: ListQuery,
  options?: QueryOptions<AdminPayoutNotificationListResponse>
) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeNotificationKeys.list(query),
    queryFn: () => client.admin.stripe.notifications.query(query ?? {}),
    ...options,
  })

  return { ...data, ...rest }
}

export const useSendTestNotification = (options?: MutationOptions<{ notification: unknown }>) =>
  useStripeMutation(() => client.admin.stripe.notifications.test.mutate({}), options)

export const useSellers = (query?: ListQuery, options?: QueryOptions<SellerListResponse>) => {
  const { data, ...rest } = useQuery({
    queryKey: stripeSellerKeys.list(query),
    queryFn: () => client.admin.sellers.query({ fields: "id,name", ...query }),
    ...options,
  })

  return { ...data, ...rest }
}
