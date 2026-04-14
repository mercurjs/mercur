import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: attributes, metadata } = await query.graph({
    entity: "attribute",
    filters: req.filterableFields,
    ...req.queryConfig,
  })

  return res.json({
    attributes,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take,
  })
}
