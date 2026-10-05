import { BigNumberInput } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import {
  SPLIT_ORDER_PAYMENT_DATA_KEY,
  SPLIT_ORDER_PAYMENT_PROVIDER_ID,
} from "../../../providers/payment-split-order/constants"
import {
  allocateProportionally,
  CART_PAYMENT_COLLECTION_KEY,
  getCurrencyDecimalDigits,
  isPaymentCaptured,
  loadSplitOrderPaymentGroup,
  SPLIT_ORDER_COLLECTIONS_FLAG,
} from "../utils"

export type CreateSplitOrderPaymentsStepInput = {
  cart_id: string
}

export type SplitOrderPaymentShare = {
  order_id: string
  payment_collection_id: string
  payment_id: string
  currency_code: string
  captures: { id: string; amount: BigNumberInput }[]
}

type CompensationInput = {
  cart_payment_collection_id: string
  cart_payment_collection_metadata: Record<string, unknown>
  shares: SplitOrderPaymentShare[]
}

export const createSplitOrderPaymentsStepId = "create-split-order-payments"

/**
 * Gives every order of a cart its own payment collection, linked to the order
 * and holding a payment for the order's share of what the customer paid.
 * Orders that already have theirs are skipped, and nothing happens while the
 * cart payment is not authorized yet.
 */
export const createSplitOrderPaymentsStep = createStep(
  createSplitOrderPaymentsStepId,
  async (input: CreateSplitOrderPaymentsStepInput, { container }) => {
    const group = await loadSplitOrderPaymentGroup(container, input)
    const cartPayment = group?.payment
    const pending = (group?.orders ?? []).filter((order) => !order.payment)

    if (!group || !cartPayment || !pending.length) {
      return new StepResponse<SplitOrderPaymentShare[], CompensationInput>([], {
        cart_payment_collection_id: "",
        cart_payment_collection_metadata: {},
        shares: [],
      })
    }

    const paymentModule = container.resolve(Modules.PAYMENT)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const amounts = allocateProportionally({
      amount: cartPayment.raw_amount ?? cartPayment.amount,
      weights: group.orders.map((order) => order.total),
      decimalDigits: getCurrencyDecimalDigits(cartPayment.currency_code),
    })

    const compensation: CompensationInput = {
      cart_payment_collection_id: group.payment_collection.id,
      cart_payment_collection_metadata: group.payment_collection.metadata ?? {},
      shares: [],
    }

    try {
      for (const order of pending) {
        const amount = amounts[group.orders.indexOf(order)].toNumber()

        const collection = await paymentModule.createPaymentCollections({
          currency_code: cartPayment.currency_code,
          amount,
          metadata: {
            [CART_PAYMENT_COLLECTION_KEY]: group.payment_collection.id,
          },
        })

        const share: SplitOrderPaymentShare = {
          order_id: order.id,
          payment_collection_id: collection.id,
          payment_id: "",
          currency_code: cartPayment.currency_code,
          captures: [],
        }
        compensation.shares.push(share)

        const session = await paymentModule.createPaymentSession(
          collection.id,
          {
            provider_id: SPLIT_ORDER_PAYMENT_PROVIDER_ID,
            currency_code: cartPayment.currency_code,
            amount,
            data: {
              ...cartPayment.data,
              [SPLIT_ORDER_PAYMENT_DATA_KEY]: {
                provider_id: cartPayment.provider_id,
                payment_id: cartPayment.id,
                captured: isPaymentCaptured(cartPayment),
              },
            },
            context: {},
          }
        )

        const payment = await paymentModule.authorizePaymentSession(
          session.id,
          {}
        )

        if (!payment) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Payment for order ${order.id} could not be authorized`
          )
        }

        share.payment_id = payment.id
        share.captures = (payment.captures ?? []).map((capture) => ({
          id: capture.id,
          amount: capture.raw_amount ?? capture.amount,
        }))

        await link.create({
          [Modules.ORDER]: { order_id: order.id },
          [Modules.PAYMENT]: { payment_collection_id: collection.id },
        })
      }

      await paymentModule.updatePaymentCollections(group.payment_collection.id, {
        metadata: {
          ...group.payment_collection.metadata,
          [SPLIT_ORDER_COLLECTIONS_FLAG]: true,
        },
      })
    } catch (error) {
      await removeShares(container, compensation)
      throw error
    }

    return new StepResponse<SplitOrderPaymentShare[], CompensationInput>(
      compensation.shares,
      compensation
    )
  },
  async (compensation, { container }) => {
    if (!compensation?.shares.length) {
      return
    }

    await removeShares(container, compensation)
  }
)

const removeShares = async (
  container: Parameters<typeof loadSplitOrderPaymentGroup>[0],
  compensation: CompensationInput
) => {
  const paymentModule = container.resolve(Modules.PAYMENT)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  await link.dismiss(
    compensation.shares.map((share) => ({
      [Modules.ORDER]: { order_id: share.order_id },
      [Modules.PAYMENT]: {
        payment_collection_id: share.payment_collection_id,
      },
    }))
  )

  await paymentModule.deletePaymentCollections(
    compensation.shares.map((share) => share.payment_collection_id)
  )

  await paymentModule.updatePaymentCollections(
    compensation.cart_payment_collection_id,
    { metadata: compensation.cart_payment_collection_metadata }
  )
}
