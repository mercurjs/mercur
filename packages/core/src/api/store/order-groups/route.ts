import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"
import { StoreGetOrderGroupsParamsType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<StoreGetOrderGroupsParamsType>,
  res: MedusaResponse<HttpTypes.StoreOrderGroupListResponse>
) => {
  const customerId = req.auth_context.actor_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: order_groups, metadata } = await query.graph({
    entity: "order_group",
    filters: {
      ...req.filterableFields,
      customer_id: customerId,
    },
    fields: req.queryConfig.fields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    order_groups,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
