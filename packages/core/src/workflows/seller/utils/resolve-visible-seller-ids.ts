import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { SellerStatus } from "@mercurjs/types"

export const resolveVisibleSellerIds = async (
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  // `now` is part of the cache key, so it is truncated to the minute to let
  // requests within the same minute share one cached entry.
  const now = new Date(Math.floor(Date.now() / 60_000) * 60_000)

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
  }, { cache: { enable: true } })

  return visibleSellers.map((s: { id: string }) => s.id)
}

/**
 * Sellers whose offers may be added to a cart and checked out. Unlike the
 * storefront listing, a seller awaiting approval is not blocked here: its
 * catalog is already reachable and the operator gate is on the payout side.
 */
export const resolveOrderableSellerIds = async (
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const now = new Date(Math.floor(Date.now() / 60_000) * 60_000)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: {
      status: { $nin: [SellerStatus.SUSPENDED, SellerStatus.TERMINATED] },
      $and: [
        { $or: [{ closed_from: null }, { closed_from: { $gt: now } }] },
        { $or: [{ closed_to: null }, { closed_to: { $lt: now } }] },
      ],
    },
  }, { cache: { enable: true } })

  return sellers.map((s: { id: string }) => s.id)
}
