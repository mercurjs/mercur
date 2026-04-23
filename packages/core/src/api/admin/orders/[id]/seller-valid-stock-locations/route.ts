import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { resolveOrderSeller } from "../../../helpers/resolve-order-seller"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params as { id: string }

  const { seller_id } = await resolveOrderSeller(req.scope, id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Math.min(
    Number(req.query.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT
  )
  const offset = Number(req.query.offset ?? 0)

  const { data: links, metadata } = await query.graph({
    entity: "stock_location_seller",
    fields: [
      "stock_location.id",
      "stock_location.name",
      "stock_location.address.*",
      "stock_location.metadata",
    ],
    filters: { seller_id },
    pagination: { take: limit, skip: offset },
  })

  const stock_locations = (links as Array<{ stock_location: unknown }>)
    .map((l) => l.stock_location)
    .filter(Boolean)

  res.status(200).json({
    stock_locations,
    count: metadata?.count ?? stock_locations.length,
    limit,
    offset,
  })
}
