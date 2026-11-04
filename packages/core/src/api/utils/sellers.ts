import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { SellerStatus } from "@mercurjs/types"

// Truncated to the minute: `now` is part of the cache key, so requests within
// the same minute share one cached entry.
export const sellerVisibilityNow = () =>
  new Date(Math.floor(Date.now() / 60_000) * 60_000)

export const storeSellerVisibilityFilter = (
  now: Date = sellerVisibilityNow()
) => ({
  status: SellerStatus.OPEN,
  $and: [
    { $or: [{ closed_from: { $eq: null } }, { closed_from: { $gt: now } }] },
    { $or: [{ closed_to: { $eq: null } }, { closed_to: { $lt: now } }] },
  ],
})

type VisibilitySeller = {
  status?: string | null
  closed_from?: string | Date | null
  closed_to?: string | Date | null
}

export const isSellerVisibleInStore = (
  seller: VisibilitySeller,
  now: Date = sellerVisibilityNow()
) => {
  if (seller.status !== SellerStatus.OPEN) {
    return false
  }
  const closedFrom = seller.closed_from ? new Date(seller.closed_from) : null
  const closedTo = seller.closed_to ? new Date(seller.closed_to) : null
  return (!closedFrom || closedFrom > now) && (!closedTo || closedTo < now)
}

export const resolveVisibleSellerIds = async (
  scope: MedusaContainer
): Promise<string[]> => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: visibleSellers } = await query.graph(
    {
      entity: "seller",
      fields: ["id"],
      filters: storeSellerVisibilityFilter(),
    },
    // Automatic tags come from the returned rows, so an empty result would
    // never be invalidated without the explicit list tag.
    {
      cache: {
        enable: true,
        tags: ["Seller:list:*"],
        computeAutomaticTags: true,
      },
    }
  )

  return visibleSellers.map((s: { id: string }) => s.id)
}
