import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { fetchSellerByAuthActorId } from "./helpers/helpers"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { data: notifications, metadata } = await query.graph({
    entity: "notification",
    fields: req.queryConfig.fields,
    filters: { channel: "seller_feed", to: seller.id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    notifications,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  })
}
