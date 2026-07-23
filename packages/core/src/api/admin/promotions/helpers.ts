import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const PLATFORM_OWNER = "platform"

// The admin promotion list exposes an "Owner" filter: a promotion is either
// marketplace-owned (no seller link) or store-owned (linked to a seller).
// Owner is a cross-module link, so it can't be filtered on the promotion
// entity directly — resolve it into a promotion-id filter here and let the
// native list handler run with the narrowed set.
export const applyPromotionSellerFilter = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const filterableFields = req.filterableFields ?? {}
  const sellerId = filterableFields.seller_id as string | string[] | undefined

  if (!sellerId) {
    return next()
  }

  delete filterableFields.seller_id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const wantsPlatform =
    sellerId === PLATFORM_OWNER ||
    (Array.isArray(sellerId) && sellerId.includes(PLATFORM_OWNER))

  if (wantsPlatform) {
    const { data: links } = await query.graph({
      entity: "promotion_seller",
      fields: ["promotion_id"],
    })
    const ownedIds = links.map((l: { promotion_id: string }) => l.promotion_id)

    filterableFields.id = ownedIds.length ? { $nin: ownedIds } : undefined
    return next()
  }

  const { data: links } = await query.graph({
    entity: "promotion_seller",
    fields: ["promotion_id"],
    filters: { seller_id: sellerId },
  })
  const promotionIds = links.map(
    (l: { promotion_id: string }) => l.promotion_id
  )

  filterableFields.id = promotionIds.length ? promotionIds : ["__no_match__"]
  return next()
}
