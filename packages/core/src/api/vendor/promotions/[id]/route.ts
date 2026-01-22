import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deletePromotionsWorkflow,
  updatePromotionsWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchPromotion, validateSellerPromotion } from "../helpers"
import { VendorUpdatePromotionType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPromotionResponse>
) => {
  const { id } = req.params

  await validateSellerPromotion(req.scope, req.auth_context.actor_id, id)

  const promotion = await refetchPromotion(
    id,
    req.scope,
    req.queryConfig.fields
  )

  if (!promotion) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Promotion with id: ${id} was not found`
    )
  }

  res.json({ promotion })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdatePromotionType>,
  res: MedusaResponse<HttpTypes.VendorPromotionResponse>
) => {
  const { id } = req.params

  await validateSellerPromotion(req.scope, req.auth_context.actor_id, id)

  await updatePromotionsWorkflow(req.scope).run({
    input: {
      promotionsData: [{ id, ...req.validatedBody }],
    },
  })

  const promotion = await refetchPromotion(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ promotion })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPromotionDeleteResponse>
) => {
  const { id } = req.params

  await validateSellerPromotion(req.scope, req.auth_context.actor_id, id)

  await deletePromotionsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({
    id,
    object: "promotion",
    deleted: true,
  })
}
