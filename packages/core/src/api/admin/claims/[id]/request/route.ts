import { cancelBeginOrderClaimWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { confirmClaimRequestWorkflow } from "../../../../../workflows/order/workflows/confirm-claim-request"

const RETURN_FIELDS = [
  "id",
  "order_id",
  "exchange_id",
  "claim_id",
  "display_id",
  "location_id",
  "order_version",
  "status",
  "metadata",
  "no_notification",
  "refund_amount",
  "created_by",
  "created_at",
  "updated_at",
  "canceled_at",
  "requested_at",
  "received_at",
  "items.*",
  "items.reason.*",
]

/**
 * Mercur override of Medusa's `POST /admin/claims/:id/request`.
 * Calls Mercur's `confirmClaimRequestWorkflow` so outbound reservations
 * are adjusted through `offer.inventory_item_link[].required_quantity` —
 * bundle-style offers don't under-reserve on the admin path either.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminClaimRequestResponse>
) => {
  const { id } = req.params

  const { result } = await confirmClaimRequestWorkflow(req.scope).run({
    input: {
      claim_id: id,
      confirmed_by: req.auth_context.actor_id,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [orderClaim],
  } = await query.graph({
    entity: "order_claim",
    fields: req.queryConfig.fields,
    filters: {
      id,
      ...req.filterableFields,
    },
  })

  let orderReturn: HttpTypes.AdminReturn | undefined
  const returnId = (orderClaim as { return_id?: string } | undefined)?.return_id
  if (returnId) {
    const { data: returns } = await query.graph({
      entity: "return",
      fields: RETURN_FIELDS,
      filters: { id: returnId },
    })
    orderReturn = returns?.[0] as unknown as HttpTypes.AdminReturn | undefined
  }

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    claim: orderClaim as unknown as HttpTypes.AdminClaim,
    return: orderReturn as HttpTypes.AdminReturn,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminClaimDeleteResponse>
) => {
  const { id } = req.params

  await cancelBeginOrderClaimWorkflow(req.scope).run({
    input: { claim_id: id },
  })

  res.status(200).json({
    id,
    object: "claim",
    deleted: true,
  })
}
