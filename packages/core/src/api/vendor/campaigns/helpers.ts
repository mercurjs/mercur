import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const refetchCampaign = async (
  campaignId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [campaign],
  } = await query.graph({
    entity: "campaign",
    filters: { id: campaignId },
    fields,
  })

  return campaign
}

export const validateSellerCampaign = async (
  scope: MedusaContainer,
  sellerId: string,
  campaignId: string
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerCampaign],
  } = await query.graph({
    entity: "seller_campaign",
    filters: {
      seller_id: sellerId,
      campaign_id: campaignId,
    },
    fields: ["seller_id"],
  })

  if (!sellerCampaign) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Campaign with id: ${campaignId} was not found`
    )
  }
}
