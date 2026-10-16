import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { SellerRegionLink } from "./associate-sellers-with-regions"

export interface ResolveSellerRegionIdsStepInput {
  requests: {
    seller_id: string
    region_ids?: string[] | null
  }[]
}

export const resolveSellerRegionIdsStepId = "resolve-seller-region-ids"

export const resolveSellerRegionIdsStep = createStep(
  resolveSellerRegionIdsStepId,
  async (input: ResolveSellerRegionIdsStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [store],
    } = await query.graph({
      entity: "store",
      fields: ["default_region_id"],
    })

    const defaultRegionId =
      (store as { default_region_id?: string | null } | undefined)
        ?.default_region_id ?? null

    const links: SellerRegionLink[] = input.requests.flatMap((request) => {
      const regionIds = [
        ...(defaultRegionId ? [defaultRegionId] : []),
        ...(request.region_ids ?? []),
      ]

      return Array.from(new Set(regionIds)).map((region_id) => ({
        seller_id: request.seller_id,
        region_id,
      }))
    })

    return new StepResponse(links)
  }
)
