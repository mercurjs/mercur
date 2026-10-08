import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PrepareAdjustmentsFromPromotionActionsStepOutput } from "@medusajs/medusa/core-flows"
import { filterSellerAdjustments } from "../utils/seller-promotion-scope"

export type FilterSellerAdjustmentsStepInput = Pick<
    PrepareAdjustmentsFromPromotionActionsStepOutput,
    "lineItemAdjustmentsToCreate" | "shippingMethodAdjustmentsToCreate"
>

export type FilterSellerAdjustmentsStepOutput = FilterSellerAdjustmentsStepInput & {
    computedPromotionCodes: string[]
}

export const filterSellerAdjustmentsStep = createStep(
    "filter-seller-adjustments",
    async (data: FilterSellerAdjustmentsStepInput, { container }) => {
        const { lineItemAdjustmentsToCreate, shippingMethodAdjustmentsToCreate } =
            await filterSellerAdjustments(container, data)

        return new StepResponse({
            lineItemAdjustmentsToCreate,
            shippingMethodAdjustmentsToCreate,
            computedPromotionCodes: [
                ...lineItemAdjustmentsToCreate,
                ...shippingMethodAdjustmentsToCreate,
            ].map((adjustment) => adjustment.code),
        } satisfies FilterSellerAdjustmentsStepOutput)
    }
)
