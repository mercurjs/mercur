import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { resolveSplitOrderCartId } from "@mercurjs/core/workflows"

import { EXTERNAL_PAYMENT_PROVIDER_ID } from "../../../types"

export type ResolveExternalCartPaymentStepInput = {
  order_group_id: string
  order_ids: string[]
}

export type ExternalCartPayment = {
  cart_id: string
  payment_id: string
  captured: boolean
  canceled: boolean
}

type CartPaymentRow = {
  id: string
  provider_id: string
  captured_at: Date | string | null
  canceled_at: Date | string | null
}

export const resolveExternalCartPaymentStepId = "resolve-external-cart-payment"
/**
 * Finds the cart-level payment held by the external provider for an order
 * group. Until it is captured, the child orders have no payment of their own.
 */
export const resolveExternalCartPaymentStep = createStep(
  resolveExternalCartPaymentStepId,
  async (input: ResolveExternalCartPaymentStepInput, { container }) => {
    const [orderId] = input.order_ids
    if (!orderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order group with id "${input.order_group_id}" has no orders`
      )
    }

    const cartId = await resolveSplitOrderCartId(container, { order_id: orderId })
    if (!cartId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order group with id "${input.order_group_id}" is not linked to a cart`
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart_payment_collection",
      fields: [
        "payment_collection.payments.id",
        "payment_collection.payments.provider_id",
        "payment_collection.payments.captured_at",
        "payment_collection.payments.canceled_at",
      ],
      filters: { cart_id: cartId },
    })

    const payments = data.flatMap(
      (link) => (link.payment_collection?.payments ?? []) as (CartPaymentRow | null)[]
    )
    const payment = payments.find(
      (p): p is CartPaymentRow =>
        !!p && p.provider_id === EXTERNAL_PAYMENT_PROVIDER_ID && !p.canceled_at
    ) ?? payments.find(
      (p): p is CartPaymentRow => !!p && p.provider_id === EXTERNAL_PAYMENT_PROVIDER_ID
    )

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order group with id "${input.order_group_id}" has no payment on the external provider`
      )
    }

    return new StepResponse<ExternalCartPayment>({
      cart_id: cartId,
      payment_id: payment.id,
      captured: !!payment.captured_at,
      canceled: !!payment.canceled_at,
    })
  }
)
