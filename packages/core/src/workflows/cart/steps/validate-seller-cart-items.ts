import {
    CartLineItemDTO,
    CartWorkflowDTO,
    ProductVariantDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateSellerCartItemsStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            variant: ProductVariantDTO
        })[]
    }
    sellerProducts: {
        seller_id: string
        product_id: string
    }[]
}

export const validateSellerCartItemsStep = createStep(
    "validate-seller-cart-items",
    (input: ValidateSellerCartItemsStepInput, { container }) => {
        const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
        const productSellerMap = new Map<string, string>(
            input.sellerProducts.map((sp) => [sp.product_id, sp.seller_id])
        )

        const itemsWithMissingSellers = input.cart.items.filter((item) => {
            const sellerId = productSellerMap.get(item.variant.product_id!)
            return !sellerId
        })

        if (itemsWithMissingSellers.length > 0) {
            logger.warn(
                `The cart items required to be assigned to a seller but some of them are missing: ${itemsWithMissingSellers.map((item) => item.variant.product_id).join(", ")}`
            )

            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `The cart items required to be assigned to a seller but some of them are missing`
            )
        }

        return new StepResponse(void 0)
    }
)
