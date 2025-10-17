/**
 * @schema StoreReturn
 * type: object
 * description: The return's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The return's ID.
 *   status:
 *     type: string
 *     description: The return's status.
 *     enum:
 *       - canceled
 *       - requested
 *       - received
 *       - partially_received
 *   refund_amount:
 *     type: number
 *     title: refund_amount
 *     description: The amount refunded by this return.
 *   order_id:
 *     type: string
 *     title: order_id
 *     description: The ID of the associated order.
 *   items:
 *     type: array
 *     description: The return's items.
 *     items:
 *       $ref: "#/components/schemas/StoreReturnItem"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the return was created.
 *   canceled_at:
 *     type: string
 *     title: canceled_at
 *     description: The date the return was canceled.
 *     format: date-time
 *   exchange_id:
 *     type: string
 *     title: exchange_id
 *     description: The return's exchange id.
 *   location_id:
 *     type: string
 *     title: location_id
 *     description: The return's location id.
 *   claim_id:
 *     type: string
 *     title: claim_id
 *     description: The return's claim id.
 *   order_version:
 *     type: number
 *     title: order_version
 *     description: The return's order version.
 *   display_id:
 *     type: number
 *     title: display_id
 *     description: The return's display id.
 *   no_notification:
 *     type: boolean
 *     title: no_notification
 *     description: Whether the customer should receive notifications about the return's updates.
 *   received_at:
 *     type: string
 *     title: received_at
 *     description: The date the return was received.
 */

/**
 * @schema StoreReturnItem
 * type: object
 * description: The return item's details.
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The return item's ID.
 *   quantity:
 *     type: number
 *     title: quantity
 *     description: The return item's quantity.
 *   received_quantity:
 *     type: number
 *     title: received_quantity
 *     description: The received quantity of the item. This quantity is added to the stocked inventory quantity of the item.
 *   damaged_quantity:
 *     type: number
 *     title: damaged_quantity
 *     description: The received damaged quantity of the item, which isn't added to the stocked inventory quantity of the item.
 *   reason_id:
 *     type: string
 *     title: reason_id
 *     description: The ID of the return reason associated with the item.
 *   note:
 *     type: string
 *     title: note
 *     description: A note about why the item was returned.
 *   item_id:
 *     type: string
 *     title: item_id
 *     description: The ID of the associated order item.
 *   return_id:
 *     type: string
 *     title: return_id
 *     description: The ID of the return this return item belongs to.
 *   metadata:
 *     type: object
 *     description: The return item's metadata, can hold custom key-value pairs.
 */
