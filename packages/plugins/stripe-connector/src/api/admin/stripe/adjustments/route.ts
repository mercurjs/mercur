import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { sellerAccountIds } from "../../../utils/settlements"
import { AdjustmentDTO } from "../../../../types/common"
import { AdminAdjustmentListResponse, AdminAdjustmentResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"
import { AdminCreateAdjustmentType, AdminGetAdjustmentsParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, AdminGetAdjustmentsParamsType>,
  res: MedusaResponse<AdminAdjustmentListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: adjustments, metadata } = await query.graph({
    entity: "adjustment",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })
  res.json({
    adjustments: adjustments as unknown as AdjustmentDTO[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
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
