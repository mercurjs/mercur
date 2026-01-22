import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { addOrRemoveCampaignPromotionsWorkflow } from "@medusajs/core-flows"
import { LinkMethodRequest } from "@medusajs/framework/types"
import { HttpTypes } from "@mercurjs/types"

import { refetchCampaign, validateSellerCampaign } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<LinkMethodRequest>,
  res: MedusaResponse<HttpTypes.VendorCampaignResponse>
) => {
  const { id } = req.params

  await validateSellerCampaign(req.scope, req.auth_context.actor_id, id)

  const { add, remove } = req.validatedBody

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
