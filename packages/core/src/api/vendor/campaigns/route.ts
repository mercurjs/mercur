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

const buildStatusFilter = (status: "active" | "scheduled" | "expired") => {
  const now = new Date()

  switch (status) {
    case "expired":
      return { ends_at: { $lt: now } }
    case "scheduled":
      return { starts_at: { $gt: now } }
    case "active":
      return {
        $and: [
          { $or: [{ starts_at: { $lte: now } }, { starts_at: null }] },
          { $or: [{ ends_at: { $gte: now } }, { ends_at: null }] },
        ],
      }
  }
}

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetCampaignsParamsType>,
  res: MedusaResponse<HttpTypes.VendorCampaignListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { budget_type, status, ...filterableFields } = req.filterableFields as {
    budget_type?: string
    status?: "active" | "scheduled" | "expired"
  } & Record<string, unknown>

  const filters: Record<string, unknown> = { ...filterableFields }

  if (budget_type) {
    filters.budget = {
      ...(filters.budget as Record<string, unknown> | undefined),
      type: budget_type,
    }
  }

  if (status) {
    Object.assign(filters, buildStatusFilter(status))
  }

  const { data: campaigns, metadata } = await query.graph({
    entity: "campaign",
    fields: req.queryConfig.fields,
    filters,
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
  const sellerId = req.seller_context!.seller_id

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
