import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http';
import { cancelOrderItemsWorkflow } from '../../../../../../workflows/order/workflows';
import { StoreCancelOrderItemsType } from '../../../validators';

/**
 * @oas [post] /store/orders/{id}/items/cancel
 * operationId: "StoreCancelOrderItems"
 * summary: "Cancel Order Items"
 * description: "Cancel individual items from an order. Items that have already been shipped cannot be canceled."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Order.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - items
 *         properties:
 *           items:
 *             type: array
 *             description: Array of items to cancel with their quantities
 *             items:
 *               type: object
 *               required:
 *                 - id
 *                 - quantity
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the line item to cancel
 *                 quantity:
 *                   type: number
 *                   description: The quantity to cancel
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
 *               description: The ID of the order
 *             canceled_items:
 *               type: array
 *               description: The items that were canceled
 *             refund_amount:
 *               type: number
 *               description: The total refund amount
 *   "400":
 *     description: Bad Request
 *   "404":
 *     description: Order not found
 *   "401":
 *     description: Unauthorized
 * tags:
 *   - Store Orders
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCancelOrderItemsType>,
  res: MedusaResponse
) => {
  const { result } = await cancelOrderItemsWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      items: req.validatedBody.items,
      canceled_by: req.auth_context.actor_id,
      no_notification: false
    }
  });

  res.json(result);
};
