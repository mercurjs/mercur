import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const PLATFORM_OWNER = "platform"

type CampaignRow = {
  id: string
  starts_at: string | Date | null
  ends_at: string | Date | null
  budget?: { type?: string | null } | null
}

const resolveCampaignStatus = (campaign: CampaignRow) => {
  const now = new Date()

  if (campaign.ends_at && new Date(campaign.ends_at) < now) {
    return "expired"
  }

  if (campaign.starts_at && new Date(campaign.starts_at) > now) {
    return "scheduled"
  }

  return "active"
}

export const applyCampaignFilters = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}

  const sellerId = filterableFields.seller_id as string | string[] | undefined
  const budgetType = filterableFields.budget_type as string | undefined
  const status = filterableFields.status as string | undefined

  delete filterableFields.seller_id
  delete filterableFields.budget_type
  delete filterableFields.status

  if (!sellerId && !budgetType && !status) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: campaigns } = await query.graph({
    entity: "campaign",
    fields: ["id", "starts_at", "ends_at", "budget.type"],
    pagination: { take: 10000 },
  })

  const { data: links } = await query.graph({
    entity: "campaign_seller",
    fields: ["campaign_id", "seller_id"],
    pagination: { take: 10000 },
  })

  const sellersByCampaign = new Map<string, string[]>()
  for (const link of links as { campaign_id: string; seller_id: string }[]) {
    const owners = sellersByCampaign.get(link.campaign_id) ?? []
    owners.push(link.seller_id)
    sellersByCampaign.set(link.campaign_id, owners)
  }

  let rows = campaigns as CampaignRow[]

  if (sellerId) {
    const requested = Array.isArray(sellerId) ? sellerId : [sellerId]
    const wantsPlatform = requested.includes(PLATFORM_OWNER)
    const requestedSellers = requested.filter((id) => id !== PLATFORM_OWNER)

    rows = rows.filter((campaign) => {
      const owners = sellersByCampaign.get(campaign.id) ?? []
      const isPlatform = owners.length === 0

      if (wantsPlatform && isPlatform) {
        return true
      }

      return owners.some((owner) => requestedSellers.includes(owner))
    })
  }

  if (budgetType) {
    rows = rows.filter((campaign) => campaign.budget?.type === budgetType)
  }

  if (status) {
    rows = rows.filter((campaign) => resolveCampaignStatus(campaign) === status)
  }

  const ids = rows.map((campaign) => campaign.id)
  filterableFields.id = ids.length ? ids : ["__no_match__"]

  return next()
}
