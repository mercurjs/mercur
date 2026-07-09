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

// Scope products to visible sellers via the product↔seller relation on the main
// query — both engines join it, so no separate product_seller prefetch is
// needed. seller.id is indexed; the closure-window check stays on the seller
// fetch since those date fields are not.
export const applyVisibleSellerProductScope = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const visibleSellerIds = await resolveVisibleSellerIds(req.scope)

  req.filterableFields ??= {}
  req.filterableFields.seller = {
    ...((req.filterableFields.seller as object) ?? {}),
    id: visibleSellerIds.length ? visibleSellerIds : ["__none__"],
  }

  next()
}
