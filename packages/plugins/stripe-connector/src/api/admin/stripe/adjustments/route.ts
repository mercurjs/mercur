import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { sellerAccountIds } from "../../../../pipeline/settlements"
import { AdjustmentDTO } from "../../../../types/common"
import { AdminAdjustmentListResponse, AdminAdjustmentResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"
import { AdminCreateAdjustmentType, AdminGetAdjustmentsParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAdjustmentsParamsType>,
  res: MedusaResponse<AdminAdjustmentListResponse>
) => {
  const { offset = 0, limit = 20, order: _order, fields: _fields, ...filters } = req.validatedQuery
  const [adjustments, count] = await resolveConnector(req.scope).listAndCountAdjustments(filters, {
    skip: offset,
    take: limit,
    order: { created_at: "DESC" },
  })
  res.json({ adjustments: adjustments as unknown as AdjustmentDTO[], count, offset, limit })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateAdjustmentType>,
  res: MedusaResponse<AdminAdjustmentResponse>
) => {
  const body = req.validatedBody

  let accountId = body.account_id
  if (!accountId && body.seller_id) {
    ;[accountId] = await sellerAccountIds(req.scope, body.seller_id)
  }
  if (!accountId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Seller ${body.seller_id} has no payout account`)
  }

  const adjustment = await resolveConnector(req.scope).createAdjustments({
    account_id: accountId,
    type: body.type,
    amount: body.amount,
    currency_code: body.currency_code.toLowerCase(),
    reason: body.reason ?? null,
    created_by: req.auth_context?.actor_id ?? null,
  })

  res.status(201).json({ adjustment: adjustment as unknown as AdjustmentDTO })
}
