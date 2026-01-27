import { PromotionActions } from "@medusajs/framework/utils"
import {
    createHook,
    createWorkflow,
    parallelize,
    transform,
    when,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, createLineItemAdjustmentsStep, createShippingMethodAdjustmentsStep, getActionsToComputeFromPromotionsStep, getPromotionCodesToApply, prepareAdjustmentsFromPromotionActionsStep, refreshPaymentCollectionForCartWorkflow, releaseLockStep, removeLineItemAdjustmentsStep, removeShippingMethodAdjustmentsStep, updateCartPromotionsStep, UpdateCartPromotionsWorkflowInput, useQueryGraphStep, validateCartStep } from "@medusajs/medusa/core-flows"
import { cartFieldsForRefreshSteps } from "../utils"
import { prepareSellerAdjustmentsFromPromotionActionsStep } from "../steps/prepare-adjustments-from-promotion-actions"


export const updateCartSellerPromotionsWorkflow = createWorkflow(
    {
        name: 'update-cart-seller-promotions',
        idempotent: false,
    },
    (input: UpdateCartPromotionsWorkflowInput) => {
        const fetchCart = when("should-fetch-cart", { input }, ({ input }) => {
            return !input.cart
        }).then(() => {
            const { data: cart } = useQueryGraphStep({
                entity: "cart",
                fields: cartFieldsForRefreshSteps,
                filters: { id: input.cart_id },
                options: { isList: false },
            }).config({ name: "fetch-cart" })

            return cart
        })

        const cart = transform({ fetchCart, input }, ({ fetchCart, input }) => {
            return input.cart ?? fetchCart
        })

        validateCartStep({ cart })

        acquireLockStep({
            key: cart.id,
            timeout: 2,
            ttl: 10,
        })

        const validate = createHook("validate", {
            input,
            cart,
        })

        const promo_codes = transform({ input }, (data) => {
            return (data.input.promo_codes || []) as string[]
        })

        const action = transform({ input }, (data) => {
            return data.input.action || PromotionActions.ADD
        })

        const promotionCodesToApply = getPromotionCodesToApply({
            cart: cart,
            promo_codes,
            action: action as PromotionActions,
        })

        const actions = getActionsToComputeFromPromotionsStep({
            computeActionContext: cart,
            promotionCodesToApply,
        })

        const {
            lineItemAdjustmentsToCreate,
            lineItemAdjustmentIdsToRemove,
            shippingMethodAdjustmentsToCreate,
            shippingMethodAdjustmentIdsToRemove,
            computedPromotionCodes,
        } = prepareSellerAdjustmentsFromPromotionActionsStep({ actions })

        parallelize(
            removeLineItemAdjustmentsStep({ lineItemAdjustmentIdsToRemove }),
            removeShippingMethodAdjustmentsStep({
                shippingMethodAdjustmentIdsToRemove,
            }),
            createLineItemAdjustmentsStep({ lineItemAdjustmentsToCreate }),
            createShippingMethodAdjustmentsStep({
                shippingMethodAdjustmentsToCreate,
            }),
            updateCartPromotionsStep({
                id: cart.id,
                promo_codes: computedPromotionCodes,
                action: PromotionActions.REPLACE,
            })
        )

        when(
            { input },
            ({ input }) => input.force_refresh_payment_collection === true
        ).then(() => {
            refreshPaymentCollectionForCartWorkflow.runAsStep({
                input: { cart },
            })
        })

        releaseLockStep({
            key: cart.id,
        })

        return new WorkflowResponse(void 0, {
            hooks: [validate],
        })
    }
)
