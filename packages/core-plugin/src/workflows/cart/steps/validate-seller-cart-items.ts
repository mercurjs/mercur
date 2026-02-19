import {
    CartLineItemDTO,
    CartWorkflowDTO,
    ProductDTO,
    ProductVariantDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Logger } from "@medusajs/medusa"
import { SellerDTO } from "@mercurjs/types"

type ValidateSellerCartItemsStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            variant: ProductVariantDTO & {
                product: ProductDTO & {
                    seller: SellerDTO
                }
            }
        })[]
    }
}

export const validateSellerCartItemsStep = createStep(
    "validate-seller-cart-items",
    (input: ValidateSellerCartItemsStepInput, { container }) => {
        const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)

        const itemsWithMissingSellers = input.cart.items.filter((item) => {
            return !item.variant.product.seller?.id
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
