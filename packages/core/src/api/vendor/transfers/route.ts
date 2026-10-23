import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { sellerAccountIds } from "../../utils/settlements"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorTransferListResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const accountIds = await sellerAccountIds(req.scope, req.seller_context!.seller_id)
  const offset = Number(req.query.offset ?? 0)
  const limit = Math.min(Number(req.query.limit ?? 20), 200)

  if (!accountIds.length) {
    res.json({ transfers: [], count: 0, offset, limit })
    return
  }

  const filters: Record<string, unknown> = { account_id: accountIds }
  if (req.query.type) filters.type = req.query.type
  if (req.query.status) filters.status = req.query.status
  if (req.query.order_id) filters.order_id = req.query.order_id

  const [transfers, count] = await service.listAndCountTransfers(filters, {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })

  res.json({ transfers, count, offset, limit })
}
