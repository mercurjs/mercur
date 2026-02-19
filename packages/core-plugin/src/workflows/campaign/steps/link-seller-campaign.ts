import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkSellerCampaignStepInput = {
  seller_id: string
  campaign_ids: string[]
}

export const linkSellerCampaignStep = createStep(
  "link-seller-campaign",
  async (input: LinkSellerCampaignStepInput, { container }) => {
    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.LINK)

    const links = input.campaign_ids.map((campaignId) => ({
      [Modules.PROMOTION]: {
        campaign_id: campaignId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
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

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.campaign_ids.map((campaignId) => ({
      [Modules.PROMOTION]: {
        campaign_id: campaignId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
