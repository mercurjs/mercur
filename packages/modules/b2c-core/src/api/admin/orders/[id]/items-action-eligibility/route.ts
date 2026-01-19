import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { 
  canPerformAction, 
  findLastDeliveryForItem
} from "@mercurjs/framework";

import type { OrderItem } from "@mercurjs/framework";

/**
 * @oas [get] /admin/orders/{id}/items-action-eligibility
 * operationId: "GetAdminOrderItemsActionEligibility"
 * summary: "Get action eligibility for order items"
 * description: "Retrieves eligibility information for returns, exchanges, and complaints for each item in an order based on delivery date"
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: Order ID
 *     required: true
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             order_id:
 *               type: string
 *               description: The order ID
 *             can_perform_any_action:
 *               type: boolean
 *               description: Whether any action can be performed on any item
 *             items:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   item_id:
 *                     type: string
 *                   item_title:
 *                     type: string
 *                   can_perform_actions:
 *                     type: boolean
 *                   days_remaining:
 *                     type: number
 *                     nullable: true
 *                   delivered_at:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *                   reason:
 *                     type: string
 *                     enum: [not_delivered, expired]
 *                     nullable: true
 *   "404":
 *     description: Order not found
 * tags:
 *   - Orders
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "items.id",
      "items.title",
      "items.quantity",
      "items.fulfilled_quantity",
      "fulfillments.id",
      "fulfillments.delivered_at",
      "fulfillments.items.id",
      "fulfillments.items.line_item_id",
      "fulfillments.items.quantity"
    ],
    filters: { 
      id
    },
  });

  const order = orders[0];

  if (!order) {
    res.status(404).json({ 
      message: "Order not found" 
    });
    return;
  }

  const itemsEligibility = order.items.map((item: OrderItem) => {
    const lastDelivery = findLastDeliveryForItem(item.id, order.fulfillments || []);

    if (!lastDelivery?.delivered_at) {
      return {
        item_id: item.id,
        item_title: item.title,
        can_perform_actions: false,
        reason: "not_delivered",
        delivered_at: null,
        days_remaining: null
      };
    }
    
    const eligibility = canPerformAction(lastDelivery.delivered_at);
    
    return {
      item_id: item.id,
      item_title: item.title,
      can_perform_actions: eligibility.canPerform,
      days_remaining: eligibility.daysRemaining,
      delivered_at: lastDelivery.delivered_at,
      reason: eligibility.canPerform ? null : "expired"
    };
  });
  
  const anyItemEligible = itemsEligibility.some(i => i.can_perform_actions);
  
  res.json({
    order_id: order.id,
    can_perform_any_action: anyItemEligible,
    items: itemsEligibility
  });
}
