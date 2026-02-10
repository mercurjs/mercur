import { createPromotionsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreatePromotionDTO } from "@medusajs/framework/types"

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

    return new WorkflowResponse(createdPromotions)
  }
)
