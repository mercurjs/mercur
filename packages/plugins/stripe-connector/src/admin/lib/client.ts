import { adminAuth, createClient, type InferClient } from "@mercurjs/client"
import type { MedusaResponse } from "@medusajs/framework"
import type { PayoutReversalDTO } from "@mercurjs/types"
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
  AdminPayoutResponse,
  AdminPayoutStatusResponse,
  AdminSettlementListResponse,
  AdminSettlementResponse,
} from "../../types/http"

export type {
  AdminPayoutAccountListResponse,
  AdminPayoutCapture,
  AdminPayoutJob,
  AdminPayoutStatusResponse,
  AdminSettlementListResponse,
} from "../../types/http"

type ListQuery = Record<string, unknown> & { limit?: number; offset?: number }
type Route<Input, Output> = (req: { validatedBody: Input }, res: MedusaResponse<Output>) => Promise<void>
type Empty = { fields?: string }

type SellerRef = { id: string; name: string; handle: string; metadata?: Record<string, unknown> | null }

export type PayoutAccountRow = AdminPayoutAccountListResponse["payout_accounts"][number] & {
  seller?: SellerRef | null
  onboarding?: { id: string; data: Record<string, unknown> | null } | null
}
export type PayoutRow = AdminPayoutListResponse["payouts"][number] & {
  seller?: SellerRef | null
  reversals?: PayoutReversalDTO[]
}
export type SettlementRow = AdminSettlementListResponse["settlements"][number]
export type SettlementDetail = AdminSettlementResponse["settlement"]
export type AdjustmentRow = AdminAdjustmentListResponse["adjustments"][number]
export type JobRunRow = AdminPayoutJobRunListResponse["runs"][number]
export type NotificationRow = AdminPayoutNotificationListResponse["notifications"][number]

export const PAYOUT_IGNORED_KEY = "payout_ignored"

export const isIgnored = (account: PayoutAccountRow) =>
  String(account.seller?.metadata?.[PAYOUT_IGNORED_KEY] ?? "") === "true"

type Routes = {
  admin: {
    "payout-accounts": {
      GET: Route<ListQuery, AdminPayoutAccountListResponse>
      POST: Route<{ seller_id: string; provider_account_id: string }, AdminPayoutAccountResponse>
      $id: {
        GET: Route<Empty, AdminPayoutAccountResponse>
        "refresh-link": { POST: Route<Empty, AdminPayoutAccountResponse> }
        sync: { POST: Route<Empty, AdminPayoutAccountResponse> }
      }
    }
    payouts: {
      GET: Route<ListQuery, AdminPayoutListResponse>
      $id: { retry: { POST: Route<Empty, AdminPayoutResponse> } }
    }
    stripe: {
      status: { GET: Route<Empty, AdminPayoutStatusResponse> }
      accounts: {
        $id: { ignore: { POST: Route<{ ignored: boolean }, AdminPayoutAccountResponse> } }
      }
      settlements: {
        GET: Route<ListQuery, AdminSettlementListResponse>
        $id: {
          GET: Route<Empty, AdminSettlementResponse>
          retry: { POST: Route<Empty, AdminSettlementResponse> }
        }
      }
      adjustments: {
        GET: Route<ListQuery, AdminAdjustmentListResponse>
        POST: Route<
          { seller_id?: string; account_id?: string; type: string; amount: number; currency_code: string; reason?: string | null },
          AdminAdjustmentResponse
        >
      }
      jobs: {
        GET: Route<Empty, AdminPayoutJobListResponse>
        $job: {
          runs: { GET: Route<ListQuery, AdminPayoutJobRunListResponse> }
          run: { POST: Route<{ seller_id?: string; order_id?: string; order_group_id?: string }, AdminPayoutJobRunResponse> }
        }
      }
      captures: {
        GET: Route<ListQuery, AdminPayoutCaptureListResponse>
        $order_group_id: {
          capture: { POST: Route<Empty, { capture: AdminPayoutCapture }> }
          cancel: { POST: Route<Empty, { capture: AdminPayoutCapture }> }
        }
      }
      notifications: {
        GET: Route<ListQuery, AdminPayoutNotificationListResponse>
        test: { POST: Route<Empty, { notification: unknown }> }
      }
    }
  }
}

export const client: InferClient<Routes> = createClient({
  baseUrl: import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000",
  fetchOptions: { credentials: "omit" },
  auth: adminAuth(),
})
