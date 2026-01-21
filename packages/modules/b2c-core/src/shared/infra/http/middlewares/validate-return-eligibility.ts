import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { canPerformAction, findLastDeliveryForItem } from "@mercurjs/framework";

export async function validateReturnEligibilityMiddleware(
  req: MedusaRequest<{ items: Array<{ id: string; quantity: number }> }>,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const { items } = req.body;
  const { id: returnId } = req.params;

  if (!items || items.length === 0) {
    return next();
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: [returnData] } = await query.graph({
    entity: "return",
    fields: [
      "id",
      "order_id"
    ],
    filters: {
      id: returnId
    }
  });

  if (!returnData) {
    return res.status(404).json({
      message: "Return not found"
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
      id: returnData.order_id
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
        message: `Item ${requestedItem.id} has not been delivered yet. Returns can only be requested for delivered items.`
      });
    }

    const eligibility = canPerformAction(lastDelivery.delivered_at);

    if (!eligibility.canPerform) {
      return res.status(400).json({
        type: "not_allowed",
        message: `Return window has expired for item ${requestedItem.id}. Returns, exchanges, and complaints are only available within 30 days of delivery.`
      });
    }
  }

  return next();
}
