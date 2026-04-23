import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { hasFulfilledItems } from "../helpers/has-fulfilled-items"
import { isOrderCanceled } from "../helpers/is-order-canceled"

export type ValidateCancelStepInput = {
  order_id: string
}

/**
 * Rejects order cancel when any item has fulfilled quantity greater than zero.
 * Shared between admin and vendor cancel paths via the Mercur cancel-order
 * wrapper workflow (and mirrored at the admin middleware layer for direct API
 * calls that do not go through the wrapper).
 */
export const validateCancelStep = createStep(
  "validate-cancel-order",
  async (input: ValidateCancelStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "canceled_at", "items.*", "items.detail.*"],
      filters: { id: input.order_id },
    })

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id ${input.order_id} was not found`
      )
    }

    if (isOrderCanceled(order as any)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Order is already canceled.",
        "ORDER_ALREADY_CANCELED"
      )
    }

    if (hasFulfilledItems(order as any)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot cancel an order that has fulfilled items.",
        "CANCEL_BLOCKED_BY_FULFILLMENT"
      )
    }

    return new StepResponse(void 0)
  }
)
