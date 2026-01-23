import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { SELLER_MODULE } from "../../../modules/seller"

type LinkSellerCampaignStepInput = {
  seller_id: string
  campaign_ids: string[]
}

export const linkSellerCampaignStep = createStep(
  "link-seller-campaign",
  async (input: LinkSellerCampaignStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.campaign_ids.map((campaignId) => ({
      [SELLER_MODULE]: {
        seller_id: input.seller_id,
      },
      [Modules.PROMOTION]: {
        campaign_id: campaignId,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      campaign_ids: input.campaign_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.campaign_ids.map((campaignId) => ({
      [SELLER_MODULE]: {
        seller_id: data.seller_id,
      },
      [Modules.PROMOTION]: {
        campaign_id: campaignId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
