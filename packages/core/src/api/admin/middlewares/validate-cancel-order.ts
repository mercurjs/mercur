import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { hasFulfilledItems } from "../../../workflows/order/helpers/has-fulfilled-items"
import { isOrderCanceled } from "../../../workflows/order/helpers/is-order-canceled"

/**
 * Admin middleware mirroring the Mercur cancel-order invariant before the
 * Medusa-provided handler runs. The workflow step `validateCancelStep`
 * enforces the same predicate for the vendor wrapper; this middleware is the
 * defense-in-depth for admin-side direct calls.
 */
export const validateCancelOrderMiddleware = async (
  req: AuthenticatedMedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "canceled_at", "items.*", "items.detail.*"],
      filters: { id: req.params.id },
    })

    if (!order) {
      return next(
        new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Order with id ${req.params.id} was not found`
        )
      )
    }

    if (isOrderCanceled(order as any)) {
      return next(
        new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Order is already canceled.",
          "ORDER_ALREADY_CANCELED"
        )
      )
    }

    if (hasFulfilledItems(order as any)) {
      return next(
        new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cannot cancel an order that has fulfilled items.",
          "CANCEL_BLOCKED_BY_FULFILLMENT"
        )
      )
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
