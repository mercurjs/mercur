/**
 * @schema AdminOrderSet
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
 *     description: The orders associated with this order set.
 *     items:
 *       type: object
 *       description: Order object with details.
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
