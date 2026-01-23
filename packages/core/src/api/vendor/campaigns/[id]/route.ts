import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deleteCampaignsWorkflow,
  updateCampaignsWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchCampaign, validateSellerCampaign } from "../helpers"
import { VendorUpdateCampaignType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCampaignResponse>
) => {
  const { id } = req.params

  await validateSellerCampaign(req.scope, req.auth_context.actor_id, id)

  const campaign = await refetchCampaign(
    id,
    req.scope,
    req.queryConfig.fields
  )

  if (!campaign) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Campaign with id: ${id} was not found`
    )
  }

  res.json({ campaign })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateCampaignType>,
  res: MedusaResponse<HttpTypes.VendorCampaignResponse>
) => {
  const { id } = req.params

  await validateSellerCampaign(req.scope, req.auth_context.actor_id, id)

  await updateCampaignsWorkflow(req.scope).run({
    input: {
      campaignsData: [{ id, ...req.validatedBody }],
    },
  })

  const campaign = await refetchCampaign(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ campaign })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorCampaignDeleteResponse>
) => {
  const { id } = req.params

  await validateSellerCampaign(req.scope, req.auth_context.actor_id, id)

  await deleteCampaignsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.json({
    id,
    object: "campaign",
    deleted: true,
  })
}
