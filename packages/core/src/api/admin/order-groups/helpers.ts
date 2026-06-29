import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const respondEmpty = (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const pagination = (req.queryConfig?.pagination ?? {}) as {
    skip?: number
    take?: number
  }
  res.json({
    order_groups: [],
    count: 0,
    offset: pagination.skip ?? 0,
    limit: pagination.take ?? 0,
  })
}

export const applyOrderGroupSellerFilter = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const sellerId = filterableFields.seller_id as string | string[] | undefined
  if (!sellerId) {
    return next()
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellerLinks } = await query.graph({
    entity: "order_seller",
    fields: ["order_id"],
    filters: { seller_id: sellerId },
  })
  const sellerOrderIds = sellerLinks.map(
    (l: { order_id: string }) => l.order_id
  )
  if (sellerOrderIds.length === 0) {
    return respondEmpty(req, res)
  }

  const { data: links } = await query.graph({
    entity: "order_group_order",
    fields: ["order_group_id"],
    filters: { order_id: sellerOrderIds },
  })
  const matchingOrderGroupIds = Array.from(
    new Set<string>(
      links.map((l: { order_group_id: string }) => l.order_group_id)
    )
  )
  if (matchingOrderGroupIds.length === 0) {
    return respondEmpty(req, res)
  }

  const existingId = filterableFields.id
  if (existingId !== undefined) {
    filterableFields.$and = [{ id: existingId }, { id: matchingOrderGroupIds }]
    delete filterableFields.id
  } else {
    // QueryGraph for `order_group` treats a plain array as IN; `{$in: [...]}`
    // returns no matches for the primary key, so pass the array directly.
    filterableFields.id = matchingOrderGroupIds
  }

  req.filterableFields = filterableFields

  return next()
}
