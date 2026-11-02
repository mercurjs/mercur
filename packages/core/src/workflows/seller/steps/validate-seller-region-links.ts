import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep } from "@medusajs/framework/workflows-sdk"

import { SellerRegionLink } from "./associate-sellers-with-regions"

export interface ValidateSellerRegionLinksStepInput {
  links: SellerRegionLink[]
}

export const validateSellerRegionLinksStepId = "validate-seller-region-links"

export const validateSellerRegionLinksStep = createStep(
  validateSellerRegionLinksStepId,
  async (input: ValidateSellerRegionLinksStepInput, { container }) => {
    if (!input.links.length) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const regionIds = Array.from(new Set(input.links.map((l) => l.region_id)))
    const sellerIds = Array.from(new Set(input.links.map((l) => l.seller_id)))

    const [{ data: regions }, { data: sellers }] = await Promise.all([
      query.graph({
        entity: "region",
        fields: ["id"],
        filters: { id: regionIds },
      }),
      query.graph({
        entity: "seller",
        fields: ["id"],
        filters: { id: sellerIds },
      }),
    ])

    const foundRegions = new Set(regions.map((r) => r.id))
    const missingRegion = regionIds.find((id) => !foundRegions.has(id))
    if (missingRegion) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Region with id: ${missingRegion} was not found`
      )
    }

    const foundSellers = new Set(sellers.map((s) => s.id))
    const missingSeller = sellerIds.find((id) => !foundSellers.has(id))
    if (missingSeller) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Seller with id: ${missingSeller} was not found`
      )
    }
  }
)
