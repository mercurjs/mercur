import { CartLineItemDTO, CartWorkflowDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Logger } from "@medusajs/medusa"
import { resolveOrderableSellerIds } from "../../seller/utils"

type ValidateSellerCartItemsStepInput = {
    cart: Omit<CartWorkflowDTO, "items"> & {
        items: (CartLineItemDTO & {
            offer?: { id: string; seller_id?: string } | null
        })[]
    }
}

export const validateSellerCartItemsStep = createStep(
    "validate-seller-cart-items",
    async (input: ValidateSellerCartItemsStepInput, { container }) => {
        const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)
        const items = input.cart.items ?? []

        const itemsWithMissingSellers = items.filter(
            (item) => {
                return !item.offer?.seller_id
            }
        )

        if (itemsWithMissingSellers.length > 0) {
            logger.warn(
                `The cart items required to be assigned to a seller but some of them are missing: ${itemsWithMissingSellers
                    .map((item) => item.id)
                    .join(", ")}`
            )

            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `The cart items required to be assigned to a seller but some of them are missing`
            )
        }

        const visibleSellerIds = new Set(await resolveOrderableSellerIds(container))
        const itemsOfUnavailableSellers = items.filter(
            (item) => !visibleSellerIds.has(item.offer!.seller_id!)
        )

        if (itemsOfUnavailableSellers.length > 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Some cart items belong to sellers that are not accepting orders: ${itemsOfUnavailableSellers
                    .map((item) => item.id)
                    .join(", ")}`
            )
        }

        return new StepResponse(void 0)
    }
)
