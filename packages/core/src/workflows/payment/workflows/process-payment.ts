import { BigNumberInput } from "@medusajs/framework/types"
import { PaymentActions } from "@medusajs/framework/utils"
import {
    createWorkflow,
    transform,
    when,
} from "@medusajs/framework/workflows-sdk"
import {
    acquireLockStep,
    authorizePaymentSessionStep,
    capturePaymentWorkflow,
    releaseLockStep,
    useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { completeCartWithSplitOrdersWorkflow } from "../../cart/workflows/complete-cart-with-split-orders"

export type ProcessPaymentWorkflowInput = {
    action: string
    data?: {
        session_id?: string
        amount?: BigNumberInput
    }
}

const THIRTY_SECONDS = 30
const TWO_MINUTES = 60 * 2

export const processPaymentWorkflowId = "mercur-process-payment"

/**
 * Mercur's counterpart to Medusa's `processPaymentWorkflow`. The capture and
 * authorization branches mirror the stock workflow; the difference is the
 * completion branch, which runs `completeCartWithSplitOrdersWorkflow` so a
 * webhook-driven checkout produces per-seller orders under an order group
 * rather than a single stock order.
 */
export const processPaymentWorkflow = createWorkflow(
    processPaymentWorkflowId,
    (input: ProcessPaymentWorkflowInput) => {
        const paymentData = useQueryGraphStep({
            entity: "payment",
            fields: ["id"],
            filters: { payment_session_id: input.data?.session_id },
        }).config({ name: "payment-query" })

        const paymentSessionResult = useQueryGraphStep({
            entity: "payment_session",
            fields: ["payment_collection_id"],
            filters: { id: input.data?.session_id },
        }).config({ name: "payment-session-query" })

        const cartPaymentCollection = useQueryGraphStep({
            entity: "cart_payment_collection",
            fields: ["cart_id"],
            filters: {
                payment_collection_id:
                    paymentSessionResult.data[0]?.payment_collection_id,
            },
        }).config({ name: "cart-payment-query" })

        // An undefined filter value matches every row, so a webhook action
        // without a session id would otherwise resolve to an arbitrary cart.
        const cartId = transform(
            { cartPaymentCollection, input },
            ({ cartPaymentCollection, input }) => {
                if (!input.data?.session_id) {
                    return undefined
                }
                return cartPaymentCollection.data[0]?.cart_id
            }
        )

        const { data: order } = useQueryGraphStep({
            entity: "order_cart",
            fields: ["id"],
            filters: { cart_id: cartId },
            options: { isList: false },
        }).config({ name: "cart-order-query" })

        when("lock-cart-when-available", { cartId }, ({ cartId }) => {
            return !!cartId
        }).then(() => {
            acquireLockStep({
                key: cartId,
                timeout: THIRTY_SECONDS,
                ttl: TWO_MINUTES,
            })
        })

        when({ input, paymentData }, ({ input, paymentData }) => {
            return (
                !!input.data?.session_id &&
                input.action === PaymentActions.SUCCESSFUL &&
                !!paymentData.data.length
            )
        }).then(() => {
            capturePaymentWorkflow
                .runAsStep({
                    input: {
                        payment_id: paymentData.data[0].id,
                        amount: input.data?.amount,
                    },
                })
                .config({ name: "capture-payment" })
        })

        // Captured with the provider but no payment record yet, meaning
        // authorize was never called — the autocapture flow.
        when({ input, paymentData }, ({ input, paymentData }) => {
            return (
                !!input.data?.session_id &&
                input.action === PaymentActions.SUCCESSFUL &&
                !paymentData.data.length
            )
        }).then(() => {
            const payment = authorizePaymentSessionStep({
                id: input.data!.session_id!,
                context: {},
            }).config({ name: "authorize-payment-session-autocapture" })

            capturePaymentWorkflow
                .runAsStep({
                    input: {
                        payment_id: payment.id,
                        amount: input.data?.amount,
                    },
                })
                .config({ name: "capture-payment-autocapture" })
        })

        // No cart is linked to the payment, so nothing will authorize the
        // session later on our behalf.
        when(
            { input, cartPaymentCollection },
            ({ input, cartPaymentCollection }) => {
                return (
                    !cartPaymentCollection.data.length &&
                    input.action === PaymentActions.AUTHORIZED &&
                    !!input.data?.session_id
                )
            }
        ).then(() => {
            authorizePaymentSessionStep({
                id: input.data!.session_id!,
                context: {},
            }).config({ name: "authorize-payment-session" })
        })

        // The orders already exist (placed with pending_authorization) and the
        // payment has now been authorized, so create the Payment record.
        when(
            "authorize-existing-order",
            { input, paymentData, cartPaymentCollection, order },
            ({ input, paymentData, cartPaymentCollection, order }) => {
                return (
                    !!order &&
                    !paymentData.data.length &&
                    !!cartPaymentCollection.data.length &&
                    input.action === PaymentActions.AUTHORIZED &&
                    !!input.data?.session_id
                )
            }
        ).then(() => {
            authorizePaymentSessionStep({
                id: input.data!.session_id!,
                context: {},
            }).config({ name: "authorize-payment-session-deferred" })
        })

        // Released before completion to prevent a deadlock: the split-order
        // workflow takes the same cart lock.
        when("release-lock-cart-when-available", { cartId }, ({ cartId }) => {
            return !!cartId
        }).then(() => {
            releaseLockStep({ key: cartId })
        })

        when(
            { input, cartPaymentCollection, order },
            ({ input, cartPaymentCollection, order }) => {
                return (
                    !!input.data?.session_id &&
                    !!cartPaymentCollection.data.length &&
                    !order
                )
            }
        ).then(() => {
            completeCartWithSplitOrdersWorkflow
                .runAsStep({
                    input: { cart_id: cartPaymentCollection.data[0].cart_id },
                })
                .config({
                    name: "complete-cart-with-split-orders",
                    // Payment processing must continue even if completion fails.
                    continueOnPermanentFailure: true,
                })
        })
    }
)
