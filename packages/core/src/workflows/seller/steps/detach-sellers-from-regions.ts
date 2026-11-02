import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import { SellerRegionLink } from "./associate-sellers-with-regions"

export interface DetachSellersFromRegionsStepInput {
  links: SellerRegionLink[]
}

export const detachSellersFromRegionsStepId = "detach-sellers-from-regions"

export const detachSellersFromRegionsStep = createStep(
  detachSellersFromRegionsStepId,
  async (input: DetachSellersFromRegionsStepInput, { container }) => {
    if (!input.links?.length) {
      return new StepResponse(void 0, [])
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.links.map((link) => ({
      [Modules.REGION]: { region_id: link.region_id },
      [MercurModules.SELLER]: { seller_id: link.seller_id },
    }))

    await remoteLink.dismiss(links)
    return new StepResponse(void 0, links)
  },
  async (links, { container }) => {
    if (!links?.length) {
      return
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)
    await remoteLink.create(links)
  }
)
