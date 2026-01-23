import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { addOrRemoveCampaignPromotionsWorkflow } from "@medusajs/core-flows"
import { LinkMethodRequest } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { refetchCampaign, validateSellerCampaign } from "../../helpers"
import { validateSellerPromotions } from "../../../promotions/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.VendorCampaignResponse>
) => {
  const { id } = req.params
  const sellerId = req.auth_context.actor_id

  await validateSellerCampaign(req.scope, sellerId, id)

  const { add = [], remove = [] } = req.validatedBody

  const promotionIdsToValidate = [...add, ...remove]
  await validateSellerPromotions(req.scope, sellerId, promotionIdsToValidate)

  await addOrRemoveCampaignPromotionsWorkflow(req.scope).run({
    input: { id, add, remove },
  })

  const campaign = await refetchCampaign(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ campaign })
}
