import { Query } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import {
    loadPromotionSellerIds,
    PromotionSellerIds,
} from "../utils/seller-promotion-scope"

export type GetPromotionSellerIdsStepInput = {
    promotion_ids: Array<string | null | undefined>
}

export const getPromotionSellerIdsStep = createStep(
    "get-promotion-seller-ids",
    async (data: GetPromotionSellerIdsStepInput, { container }) => {
        const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
        const promotionSellerIds: PromotionSellerIds = await loadPromotionSellerIds(
            query,
            data.promotion_ids
        )

        return new StepResponse(promotionSellerIds)
    }
)
