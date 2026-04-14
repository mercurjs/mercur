import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { StoreGetSellersParamsType } from "./validators"

export const GET = async (
  req: MedusaRequest<StoreGetSellersParamsType>,
  res: MedusaResponse<HttpTypes.StoreSellerListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers, metadata } = await query.graph({
    entity: "seller",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    sellers,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
