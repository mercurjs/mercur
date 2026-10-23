import { adminAuth, createClient, type InferClient } from "@mercurjs/client"
import type { MedusaResponse } from "@medusajs/framework"
import type {
  AdminAdjustmentListResponse,
  AdminAdjustmentResponse,
  AdminPayoutAccountListResponse,
  AdminPayoutAccountResponse,
  AdminPayoutCapture,
  AdminPayoutCaptureListResponse,
  AdminPayoutJobListResponse,
  AdminPayoutJobRunListResponse,
  AdminPayoutJobRunResponse,
  AdminPayoutListResponse,
  AdminPayoutNotificationListResponse,
  AdminPayoutProviderListResponse,
  AdminPayoutResponse,
  AdminPayoutStatusResponse,
  AdminSettlementListResponse,
  AdminSettlementResponse,
  AdminTransferListResponse,
  AdminTransferResponse,
} from "../../types/http"

export type {
  AdminPayoutAccountListResponse,
  AdminPayoutCapture,
  AdminPayoutJob,
  AdminPayoutStatusResponse,
  AdminSettlementListResponse,
  AdminTransferListResponse,
} from "../../types/http"

type ListQuery = Record<string, unknown> & { limit?: number; offset?: number }
type Route<Input, Output> = (req: { validatedBody: Input }, res: MedusaResponse<Output>) => Promise<void>
type Empty = { fields?: string }

export type PayoutAccountRow = AdminPayoutAccountListResponse["payout_accounts"][number] & {
  seller?: { id: string; name: string; handle: string } | null
  onboarding?: { id: string; data: Record<string, unknown> | null } | null
}
export type TransferRow = AdminTransferListResponse["transfers"][number] & {
  account?: { id: string; provider_account_id: string | null; seller?: { id: string; name: string; handle: string } | null } | null
}
export type SettlementRow = AdminSettlementListResponse["settlements"][number]
export type SettlementDetail = AdminSettlementResponse["settlement"]
export type PayoutRow = AdminPayoutListResponse["payouts"][number] & {
  seller?: { id: string; name: string; handle: string } | null
}
export type AdjustmentRow = AdminAdjustmentListResponse["adjustments"][number]
export type JobRunRow = AdminPayoutJobRunListResponse["runs"][number]
export type NotificationRow = AdminPayoutNotificationListResponse["notifications"][number]

type Routes = {
  admin: {
    "payout-status": { GET: Route<Empty, AdminPayoutStatusResponse> }
    "payout-providers": { GET: Route<Empty, AdminPayoutProviderListResponse> }
    "payout-accounts": {
      GET: Route<ListQuery, AdminPayoutAccountListResponse>
      POST: Route<{ seller_id: string; provider_id: string; provider_account_id: string }, AdminPayoutAccountResponse>
      $id: {
        GET: Route<Empty, AdminPayoutAccountResponse>
        ignore: { POST: Route<{ ignored: boolean }, AdminPayoutAccountResponse> }
        "refresh-link": { POST: Route<Empty, AdminPayoutAccountResponse> }
        sync: { POST: Route<Empty, AdminPayoutAccountResponse> }
      }
    }
    transfers: {
      GET: Route<ListQuery, AdminTransferListResponse>
      $id: {
        GET: Route<Empty, AdminTransferResponse>
        retry: { POST: Route<Empty, AdminTransferResponse> }
      }
    }
    payouts: {
      GET: Route<ListQuery, AdminPayoutListResponse>
      run: { POST: Route<{ seller_id?: string }, AdminPayoutJobRunResponse> }
      $id: { retry: { POST: Route<Empty, AdminPayoutResponse> } }
    }
    settlements: {
      GET: Route<ListQuery, AdminSettlementListResponse>
      $id: { GET: Route<Empty, AdminSettlementResponse> }
    }
    "payout-adjustments": {
      GET: Route<ListQuery, AdminAdjustmentListResponse>
      POST: Route<
        { seller_id?: string; account_id?: string; type: string; amount: number; currency_code: string; reason?: string | null },
        AdminAdjustmentResponse
      >
    }
    "payout-jobs": {
      GET: Route<Empty, AdminPayoutJobListResponse>
      $job: {
        runs: { GET: Route<ListQuery, AdminPayoutJobRunListResponse> }
        run: { POST: Route<{ seller_id?: string; order_id?: string; order_group_id?: string }, AdminPayoutJobRunResponse> }
      }
    }
    "payout-captures": {
      GET: Route<ListQuery, AdminPayoutCaptureListResponse>
      $order_group_id: {
        capture: { POST: Route<Empty, { capture: AdminPayoutCapture }> }
        cancel: { POST: Route<Empty, { capture: AdminPayoutCapture }> }
      }
    }
    "payout-notifications": {
      GET: Route<ListQuery, AdminPayoutNotificationListResponse>
      test: { POST: Route<Empty, { notification: unknown }> }
    }
  }
}

export const client: InferClient<Routes> = createClient({
  baseUrl: import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000",
  fetchOptions: { credentials: "omit" },
  auth: adminAuth(),
})
