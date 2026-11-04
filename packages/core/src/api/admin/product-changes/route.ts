import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { AdminGetProductChangesParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetProductChangesParamsType>,
  res: MedusaResponse<HttpTypes.AdminProductChangeInboxListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: product_changes, metadata } = await query.graph({
    entity: "product_change",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, inbox: true },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    product_changes:
      product_changes as unknown as HttpTypes.AdminProductChangeInboxItem[],
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
