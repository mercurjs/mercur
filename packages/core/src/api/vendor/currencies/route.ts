import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { VendorGetCurrenciesParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetCurrenciesParamsType>,
  res: MedusaResponse<HttpTypes.VendorCurrencyListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: currencies, metadata } = await query.graph({
    entity: "currency",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    currencies,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
