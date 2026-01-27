import {
    CartLineItemDTO,
    CartWorkflowDTO,
    ProductDTO,
    ProductVariantDTO,
    ShippingOptionDTO,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SellerDTO } from "@mercurjs/types"

type ValidateSellerCartShippingStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            variant: ProductVariantDTO & {
                product: ProductDTO & {
                    seller: SellerDTO
                }
            }
        })[]
    }
    shippingOptions: ShippingOptionDTO & {
        seller: SellerDTO
    }[]
}

export const validateSellerCartShippingStep = createStep(
    "validate-seller-shipping",
    (input: ValidateSellerCartShippingStepInput) => {
        const { cart, shippingOptions } = input
        const sellersWithShippingOptions = new Set<string>(
            shippingOptions.map((so) => so.seller.id)
        )

        const itemsWithMissingShippingOptions = cart.items.filter((item) => {
            const sellerId = item.variant.product.seller.id
            return item.requires_shipping && !sellersWithShippingOptions.has(sellerId)
        })

        if (itemsWithMissingShippingOptions.length > 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No shipping method selected but the cart contains seller items that require shipping."
            )
        }

        return new StepResponse(void 0)
    }
)
