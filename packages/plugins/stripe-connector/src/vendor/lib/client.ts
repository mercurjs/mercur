import { createClient, vendorAuth, type InferClient } from "@mercurjs/client"
import type { MedusaResponse } from "@medusajs/framework"
import type {
  VendorPayoutAccountMeResponse,
  VendorPayoutListResponse,
  VendorSettlementListResponse,
  VendorSettlementResponse,
  VendorTransferListResponse,
} from "../../types/http"

type ListQuery = Record<string, unknown> & { limit?: number; offset?: number }
type Route<Input, Output> = (req: { validatedBody: Input }, res: MedusaResponse<Output>) => Promise<void>
type Empty = { fields?: string }

export type VendorAccount = NonNullable<VendorPayoutAccountMeResponse["payout_account"]>
export type VendorTransferRow = VendorTransferListResponse["transfers"][number]
export type VendorSettlementRow = VendorSettlementListResponse["settlements"][number]
export type VendorPayoutRow = VendorPayoutListResponse["payouts"][number]

type Routes = {
  vendor: {
    "payout-accounts": {
      POST: Route<{ data?: Record<string, unknown>; context?: Record<string, unknown> }, { payout_account: VendorAccount }>
      me: { GET: Route<Empty, VendorPayoutAccountMeResponse> }
      $id: { onboarding: { POST: Route<{ data?: Record<string, unknown> }, { onboarding: { id: string; data: Record<string, unknown> | null } }> } }
    }
    transfers: { GET: Route<ListQuery, VendorTransferListResponse> }
    settlements: {
      GET: Route<ListQuery, VendorSettlementListResponse>
      $id: { GET: Route<Empty, VendorSettlementResponse> }
    }
    payouts: { GET: Route<ListQuery, VendorPayoutListResponse> }
  }
}

export const client: InferClient<Routes> = createClient({
  baseUrl: import.meta.env.VITE_MERCUR_BACKEND_URL || "http://localhost:9000",
  fetchOptions: { credentials: "omit" },
  auth: vendorAuth(),
})
