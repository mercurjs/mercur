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
    const needsDefault = input.requests.some((r) => !r.region_ids?.length)

    let defaultRegionId: string | null = null

    if (needsDefault) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const {
        data: [store],
      } = await query.graph({
        entity: "store",
        fields: ["default_region_id"],
      })

      defaultRegionId =
        (store as { default_region_id?: string | null } | undefined)
          ?.default_region_id ?? null
    }

    const links: SellerRegionLink[] = input.requests.flatMap((request) => {
      const regionIds = request.region_ids?.length
        ? request.region_ids
        : defaultRegionId
          ? [defaultRegionId]
          : []

      return Array.from(new Set(regionIds)).map((region_id) => ({
        seller_id: request.seller_id,
        region_id,
      }))
    })

    return new StepResponse(links)
  }
)
