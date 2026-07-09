import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { SellerStatus } from "@mercurjs/types"

export const resolveVisibleSellerIds = async (
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date()

  const { data: visibleSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: {
      status: SellerStatus.OPEN,
      $and: [
        { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
        { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
      ],
    },
  })

  return visibleSellers.map((s: { id: string }) => s.id)
}

// Scope by product `id` rather than joining across the product_seller link:
// unlike the old maybeApplyLinkFilter join, an id filter is expressible on both
// the index engine and query.graph.
export const applyVisibleSellerProductScope = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const visibleSellerIds = await resolveVisibleSellerIds(req.scope)

  const { data: links } = await query.graph({
    entity: "product_seller",
    fields: ["product_id"],
    filters: { seller_id: visibleSellerIds },
  })

  const productIds = Array.from(
    new Set(
      (links as { product_id: string | null }[])
        .map((link) => link.product_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  req.filterableFields ??= {}
  const existingAnd = (req.filterableFields.$and as object[] | undefined) ?? []
  req.filterableFields.$and = [
    ...existingAnd,
    { id: productIds.length ? productIds : ["__none__"] },
  ]

  next()
}
