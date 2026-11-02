import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { LinkDefinition } from "@medusajs/framework/types"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { dismissLinks } from "../utils"

export const createLinksStepId = "create-links"
/**
 * This step creates links between records, like Medusa's
 * `createRemoteLinkStep`. Its compensation dismisses the links no matter in
 * which order their modules come back from the stored workflow state.
 *
 * @example
 * createLinksStep([{
 *   [Modules.ORDER]: { order_id: "order_123" },
 *   [MercurModules.SELLER]: { seller_id: "sel_123" }
 * }])
 */
export const createLinksStep = createStep(
  createLinksStepId,
  async (input: LinkDefinition[], { container }) => {
    if (!input?.length) {
      return new StepResponse([], [])
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const links = await link.create(input)

    return new StepResponse(links, input)
  },
  async (createdLinks, { container }) => {
    if (!createdLinks?.length) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await dismissLinks(link, createdLinks)
  }
)
