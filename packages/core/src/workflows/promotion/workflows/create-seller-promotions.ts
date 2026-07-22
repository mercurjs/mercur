import { createPromotionsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreatePromotionDTO } from "@medusajs/framework/types"

import { linkSellerCampaignStep } from "../../campaign/steps"
import { linkSellerPromotionStep } from "../steps"

type CreateSellerPromotionsWorkflowInput = {
  promotions: CreatePromotionDTO[]
  seller_id: string
}

export const createSellerPromotionsWorkflow = createWorkflow(
  "create-seller-promotions",
  function (input: CreateSellerPromotionsWorkflowInput) {
    const createdPromotions = createPromotionsWorkflow.runAsStep({
      input: {
        promotionsData: input.promotions,
      },
    })

    const promotionIds = transform(
      createdPromotions,
      (promotions) => promotions.map((p) => p.id)
    )

    linkSellerPromotionStep({
      seller_id: input.seller_id,
      promotion_ids: promotionIds,
    })

    const campaignIds = transform(createdPromotions, (promotions) =>
      promotions.map((p) => p.campaign_id).filter((id): id is string => !!id)
    )

    when({ campaignIds }, (data) => data.campaignIds.length > 0).then(() => {
      linkSellerCampaignStep({
        seller_id: input.seller_id,
        campaign_ids: campaignIds,
      })
    })

    return new WorkflowResponse(createdPromotions)
  }
)
