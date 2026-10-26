import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPayoutListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { seller_id, ...filters } = req.filterableFields as Record<string, unknown>
  if (seller_id) {
    const { data: links } = await query.graph({
      entity: "seller_payout_account",
      fields: ["payout_account_id"],
      filters: { seller_id },
    })
    const accountIds = links.map((link) => link.payout_account_id)
    filters.account_id = accountIds.length ? accountIds : ["__none__"]
  }

  const { data: payouts, metadata } = await query.graph({
    entity: "payout",
    fields: req.queryConfig.fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    payouts,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
