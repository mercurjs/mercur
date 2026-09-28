import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type VendorRequest = AuthenticatedMedusaRequest & {
  seller_context?: { seller_id: string }
}

export async function GET(
  req: VendorRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: notifications, metadata } = await query.graph({
    entity: "notification",
    fields: req.queryConfig.fields,
    filters: { channel: "seller_feed", to: req.seller_context!.seller_id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    notifications,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  })
}
