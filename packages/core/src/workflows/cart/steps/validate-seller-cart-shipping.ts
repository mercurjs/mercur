import {
    CartLineItemDTO,
    CartWorkflowDTO,
    ShippingOptionDTO,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SellerDTO } from "@mercurjs/types"

type ValidateSellerCartShippingStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            variant?: {
                product?: { shipping_profile?: { id?: string } | null } | null
            } | null
            offer?: {
                id: string
                seller_id?: string
                shipping_profile_id?: string | null
            } | null
        })[]
    }
    shippingOptions: (ShippingOptionDTO & {
        seller: SellerDTO
    })[]
}

export const validateSellerCartShippingStep = createStep(
    "validate-seller-shipping",
    (input: ValidateSellerCartShippingStepInput) => {
        const { cart, shippingOptions } = input
        const sellersWithShippingOptions = new Set<string>(
            shippingOptions.map((so) => so.seller.id)
        )

        const itemsWithMissingShippingOptions = (cart.items ?? []).filter(
            (item) => {
                const sellerId = item.offer?.seller_id
                return (
                    item.requires_shipping &&
                    (!sellerId || !sellersWithShippingOptions.has(sellerId))
                )
            }
        )

        if (itemsWithMissingShippingOptions.length > 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No shipping method selected but the cart contains seller items that require shipping."
            )
        }

        const itemsRequiringShipping = (cart.items ?? []).filter(
            (item) => item.requires_shipping
        )
        const shippingMethods = cart.shipping_methods ?? []

        if (itemsRequiringShipping.length > 0 && shippingMethods.length === 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "No shipping method selected but the cart contains items that require shipping."
            )
        }

        const optionProfileMap = new Map(
            shippingOptions.map((so) => [so.id, so.shipping_profile_id])
        )
        const availableProfiles = new Set(
            shippingMethods.map((method) =>
                optionProfileMap.get(method.shipping_option_id as string)
            )
        )

        // The offer, not the master product, owns the shipping profile a seller
        // ships from — the product-level profile is only a fallback.
        const missingProfiles = itemsRequiringShipping
            .map(
                (item) =>
                    item.offer?.shipping_profile_id ??
                    item.variant?.product?.shipping_profile?.id
            )
            .filter((profileId) => !availableProfiles.has(profileId))

        if (missingProfiles.length > 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "The cart items require shipping profiles that are not satisfied by the current shipping methods"
            )
        }

        return new StepResponse(void 0)
    }
)
