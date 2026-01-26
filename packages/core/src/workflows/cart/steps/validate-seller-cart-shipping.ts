import {
    CartLineItemDTO,
    CartWorkflowDTO,
    ProductVariantDTO,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ValidateSellerCartShippingStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            variant: ProductVariantDTO
        })[]
    }
    sellerProducts: {
        seller_id: string
        product_id: string
    }[]
    sellerShippingOptions: {
        seller_id: string
        shipping_option_id: string
    }[]
}

export const validateSellerCartShippingStep = createStep(
    "validate-seller-shipping",
    (input: ValidateSellerCartShippingStepInput) => {
        const productSellerMap = new Map<string, string>(
            input.sellerProducts.map((sp) => [sp.product_id, sp.seller_id])
        )
        const cartSellersWithShippingOptions = new Set<string>(
            input.sellerShippingOptions.map((sso) => sso.seller_id)
        )

        const itemsWithMissingShippingOptions = input.cart.items.filter((item) => {
            const sellerId = productSellerMap.get(item.variant.product_id!)!
            return item.requires_shipping && !cartSellersWithShippingOptions.has(sellerId)
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
