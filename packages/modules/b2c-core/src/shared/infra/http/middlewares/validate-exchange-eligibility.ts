import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { canPerformAction, findLastDeliveryForItem, getActionWindowDays } from "@mercurjs/framework";

export async function validateExchangeEligibilityMiddleware(
  req: MedusaRequest<{ items: Array<{ id: string; quantity: number }> }>,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const { items } = req.body;
  const { id: exchangeId } = req.params;

  if (!items || items.length === 0) {
    return next();
  }

  const actionWindowDays = getActionWindowDays();
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: [exchange] } = await query.graph({
    entity: "order_exchange",
    fields: [
      "id",
      "order_id"
    ],
    filters: {
      id: exchangeId
    }
  });

  if (!exchange) {
    return res.status(404).json({
      message: "Exchange not found"
    });
  }

  const { data: [order] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "items.id",
      "fulfillments.id",
      "fulfillments.delivered_at",
      "fulfillments.items.id",
      "fulfillments.items.line_item_id",
      "fulfillments.items.quantity"
    ],
    filters: {
      id: exchange.order_id
    }
  });

  if (!order) {
    return res.status(404).json({
      message: "Order not found"
    });
  }

  for (const requestedItem of items) {
    const lastDelivery = findLastDeliveryForItem(
      requestedItem.id,
      order.fulfillments || []
    );

    if (!lastDelivery?.delivered_at) {
      return res.status(400).json({
        type: "not_allowed",
        message: `Item ${requestedItem.id} has not been delivered yet. Exchanges can only be requested for delivered items.`
      });
    }

    const eligibility = canPerformAction(lastDelivery.delivered_at);

    if (!eligibility.canPerform) {
      return res.status(400).json({
        type: "not_allowed",
        message: `Exchange window has expired for item ${requestedItem.id}. Exchanges are only available within ${actionWindowDays} days of delivery.`
      });
    }
  }

  return next();
}
