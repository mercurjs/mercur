import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerCampaignsWorkflow } from "../../../workflows/campaign"
import { refetchCampaign } from "./helpers"
import {
  VendorCreateCampaignType,
  VendorGetCampaignsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetCampaignsParamsType>,
  res: MedusaResponse<HttpTypes.VendorCampaignListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: campaigns, metadata } = await query.graph({
    entity: "campaign",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    campaigns,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateCampaignType>,
  res: MedusaResponse<HttpTypes.VendorCampaignResponse>
) => {
  const sellerId = req.auth_context.actor_id

  const { result } = await createSellerCampaignsWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      campaigns: [req.validatedBody],
    },
  })

  const campaign = await refetchCampaign(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ campaign })
}
