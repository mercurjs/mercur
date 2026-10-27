import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"
import { wrapOrdersWithExpectedDelivery } from "../../utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
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

  await wrapOrdersWithExpectedDelivery(
    req,
    (order_groups as { orders?: { id: string }[] | null }[]).flatMap(
      (group) => group.orders ?? []
    )
  )

  res.json({
    order_groups,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
