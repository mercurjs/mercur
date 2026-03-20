/**
 * @schema StoreCanceledOrderItem
 * title: "CanceledOrderItem"
 * description: "Canceled order item details"
 * properties:
 *   id:
 *     type: string
 *     description: The ID of the item (same as in active items if partial cancel).
 *   variant_id:
 *     type: string
 *     description: The ID of the product variant.
 *   thumbnail:
 *     type: string
 *     nullable: true
 *     description: The thumbnail URL of the product.
 *   title:
 *     type: string
 *     description: The title of the product.
 *   variant_title:
 *     type: string
 *     description: The title of the variant.
 *   product_handle:
 *     type: string
 *     description: The handle (slug) of the product.
 *   total:
 *     type: number
 *     description: The total amount of the canceled quantity.
 *   original_total:
 *     type: number
 *     description: The original total amount of the canceled quantity.
 *   canceled_quantity:
 *     type: number
 *     description: The quantity that was canceled.
 *   is_partial_cancel:
 *     type: boolean
 *     description: True if only part of the item was canceled (item still exists in active items). False if entire item was canceled.
 *   variant:
 *     type: object
 *     description: The variant details.
 *     properties:
 *       options:
 *         type: array
 *         description: The variant options.
 *         items:
 *           type: object
 */

/**
 * @schema StoreOrderSet
 * title: "OrderSet"
 * description: "Order set object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the order set.
 *   display_id:
 *     type: number
 *     description: The display ID of the order set.
 *   customer_id:
 *     type: string
 *     description: The ID of the customer associated with the order set.
 *   cart_id:
 *     type: string
 *     description: The ID of the cart associated with the order set.
 *   sales_channel_id:
 *     type: string
 *     description: The ID of the sales channel associated with the order set.
 *   payment_collection_id:
 *     type: string
 *     description: The ID of the payment collection associated with the order set.
 *   status:
 *     type: string
 *     description: The status of the order set.
 *     enum: [pending, completed, canceled, archived]
 *   payment_status:
 *     type: string
 *     description: The payment status of the order set.
 *     enum: [awaiting, not_paid, captured, partially_refunded, refunded, canceled, requires_action]
 *   fulfillment_status:
 *     type: string
 *     description: The fulfillment status of the order set.
 *     enum: [not_fulfilled, fulfilled, partially_fulfilled, shipped, partially_shipped, delivered, partially_delivered, canceled]
 *   total:
 *     type: number
 *     description: The total amount of the order set.
 *   tax_total:
 *     type: number
 *     description: The tax total of the order set.
 *   subtotal:
 *     type: number
 *     description: The subtotal of the order set.
 *   shipping_total:
 *     type: number
 *     description: The shipping total of the order set.
 *   shipping_tax_total:
 *     type: number
 *     description: The shipping tax total of the order set.
 *   orders:
 *     type: array
 *     description: The orders associated with this order set. Each order now includes a canceled_items array containing items that were canceled.
 *     items:
 *       type: object
 *       description: Order object with details.
 *       properties:
 *         items:
 *           type: array
 *           description: Active items in the order (quantity > 0).
 *         canceled_items:
 *           type: array
 *           description: Items that were canceled from the order (quantity = 0).
 *           items:
 *             $ref: "#/components/schemas/StoreCanceledOrderItem"
 *   customer:
 *     type: object
 *     description: The customer associated with the order set.
 *   cart:
 *     type: object
 *     description: The cart associated with the order set.
 *   sales_channel:
 *     type: object
 *     description: The sales channel associated with the order set.
 *   payment_collection:
 *     type: object
 *     description: The payment collection associated with the order set.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */
