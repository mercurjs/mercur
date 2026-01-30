import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

type LinkSellerPromotionStepInput = {
  seller_id: string
  promotion_ids: string[]
}

export const linkSellerPromotionStep = createStep(
  "link-seller-promotion",
  async (input: LinkSellerPromotionStepInput, { container }) => {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.promotion_ids.map((promotionId) => ({
      [Modules.PROMOTION]: {
        promotion_id: promotionId,
      },
      [MercurModules.SELLER]: {
        seller_id: input.seller_id,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, {
      seller_id: input.seller_id,
      promotion_ids: input.promotion_ids,
    })
  },
  async (data, { container }) => {
    if (!data) return

    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.promotion_ids.map((promotionId) => ({
      [Modules.PROMOTION]: {
        promotion_id: promotionId,
      },
      [MercurModules.SELLER]: {
        seller_id: data.seller_id,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
