import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"

import { SellerRegionLink } from "./associate-sellers-with-regions"

export interface ValidateSellersKeepRegionsStepInput {
  add: SellerRegionLink[]
  remove: SellerRegionLink[]
}

export const validateSellersKeepRegionsStepId = "validate-sellers-keep-regions"

export const validateSellersKeepRegionsStep = createStep(
  validateSellersKeepRegionsStepId,
  async (input: ValidateSellersKeepRegionsStepInput, { container }) => {
    const sellerIds = Array.from(new Set(input.remove.map((l) => l.seller_id)))
    if (!sellerIds.length) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: links } = await query.graph({
      entity: "region_seller",
      filters: { seller_id: sellerIds },
      fields: ["seller_id", "region_id"],
    })

    for (const sellerId of sellerIds) {
      const remaining = new Set(
        links
          .filter((l) => l.seller_id === sellerId)
          .map((l) => l.region_id as string)
      )
      input.add
        .filter((l) => l.seller_id === sellerId)
        .forEach((l) => remaining.add(l.region_id))
      input.remove
        .filter((l) => l.seller_id === sellerId)
        .forEach((l) => remaining.delete(l.region_id))

      if (!remaining.size) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Seller with id: ${sellerId} must stay assigned to at least one region`
        )
      }
    }
  }
)
