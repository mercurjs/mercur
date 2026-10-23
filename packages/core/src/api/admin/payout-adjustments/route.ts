import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { sellerAccountIds } from "../../utils/settlements"
import { AdminCreateAdjustmentType, AdminGetAdjustmentsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAdjustmentsParamsType>,
  res: MedusaResponse<HttpTypes.AdminAdjustmentListResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const { offset = 0, limit = 20, order: _order, fields: _fields, ...filters } = req.validatedQuery
  const [adjustments, count] = await service.listAndCountAdjustments(filters, {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })
  res.json({ adjustments, count, offset, limit })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAdjustmentType>,
  res: MedusaResponse<HttpTypes.AdminAdjustmentResponse>
) => {
  const service = req.scope.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const body = req.validatedBody

  let accountId = body.account_id
  if (!accountId && body.seller_id) {
    ;[accountId] = await sellerAccountIds(req.scope, body.seller_id)
  }
  if (!accountId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Seller ${body.seller_id} has no payout account`)
  }

  const adjustment = await service.createAdjustments({
    account_id: accountId,
    type: body.type,
    amount: body.amount,
    currency_code: body.currency_code.toLowerCase(),
    reason: body.reason ?? null,
    created_by: req.auth_context?.actor_id ?? null,
  })

  res.status(201).json({ adjustment })
}
