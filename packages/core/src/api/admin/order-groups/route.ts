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
  const { result } = await getOrderGroupsListWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields ?? [],
      variables: {
        ...req.filterableFields,
        skip: req.queryConfig.pagination?.skip,
        take: req.queryConfig.pagination?.take,
        order: req.queryConfig.pagination?.order as Record<string, string>,
      },
      // `applySellerFilter` strips `seller_id` from `filterableFields` (the
      // group query has no such field) — read it from the raw query so the
      // workflow can trim child orders to the selected seller.
      sellerId: req.query.seller_id as string | string[] | undefined,
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
