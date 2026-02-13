import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerPriceList } from "../../helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorPriceListPricesResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerPriceList(req.scope, sellerId, req.params.id)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: prices, metadata } = await query.graph({
    entity: "price",
    fields: req.queryConfig.fields,
    filters: {
      ...req.filterableFields,
      price_list_id: req.params.id,
    },
    pagination: req.queryConfig.pagination,
  })

  res.status(200).json({
    prices,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
