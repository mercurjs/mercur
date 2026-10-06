import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { HttpTypes } from "@mercurjs/types"

import { getOrderGroupsListWorkflow } from "../../../workflows/order-group"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderGroupListResponse>
) => {
  // `applyOrderGroupSellerFilter` already narrowed `id` to the seller's groups.
  const { seller_id: _sellerId, ...filterableFields } = req.filterableFields

  const { result } = await getOrderGroupsListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields ?? [],
      variables: {
        ...filterableFields,
        skip: req.queryConfig.pagination?.skip,
        take: req.queryConfig.pagination?.take,
        order: req.queryConfig.pagination?.order as Record<string, string>,
      },
    },
  })

  const { rows, metadata } = result

  res.json({
    order_groups: rows,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
