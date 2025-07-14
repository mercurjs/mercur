/**
 * *
 * @interface
 * 
 * The order return request line item details.
 * @property {string} id - The ID of the order return request line item.
 * @property {string} line_item_id - The associated line item's ID.
 * @property {number} quantity - The quantity of the order return request line item

 */
export type OrderReturnRequestLineItemDTO = {
  /**
 * *
 * The ID of the order return request line item.

 */
id: string
  /**
 * *
 * The associated line item's ID.

 */
line_item_id: string
  /**
 * *
 * The quantity of the order return request line item

 */
quantity: number
}

/**
 * *
 * @interface
 * 
 * The order return request details.
 * @property {string} id - The ID of the order return request.
 * @property {OrderReturnRequestLineItemDTO[]} line_items - The line items of the order return request
 * @property {string} customer_id - The associated customer's ID.
 * @property {string} customer_note - The customer note of the order return request
 * @property {string} shipping_option_id - The associated shipping option's ID.
 * @property {string} vendor_reviewer_id - The associated vendor reviewer's ID.
 * @property {string} vendor_reviewer_note - The vendor reviewer note of the order return request
 * @property {Date} vendor_review_date - The associated date.
 * @property {string} admin_reviewer_id - The associated admin reviewer's ID.
 * @property {string} admin_reviewer_note - The admin reviewer note of the order return request
 * @property {Date} admin_review_date - The associated date.
 * @property {string} status - The status of the order return request

 */
export type OrderReturnRequestDTO = {
  /**
 * *
 * The ID of the order return request.

 */
id: string
  /**
 * *
 * The line items of the order return request

 */
line_items: OrderReturnRequestLineItemDTO[]
  /**
 * *
 * The associated customer's ID.

 */
customer_id: string
  /**
 * *
 * The customer note of the order return request

 */
customer_note: string
  /**
 * *
 * The associated shipping option's ID.

 */
shipping_option_id: string | null
  /**
 * *
 * The associated vendor reviewer's ID.

 */
vendor_reviewer_id: string | null
  /**
 * *
 * The vendor reviewer note of the order return request

 */
vendor_reviewer_note: string | null
  /**
 * *
 * The associated date.

 */
vendor_review_date: Date | null
  /**
 * *
 * The associated admin reviewer's ID.

 */
admin_reviewer_id: string | null
  /**
 * *
 * The admin reviewer note of the order return request

 */
admin_reviewer_note: string | null
  /**
 * *
 * The associated date.

 */
admin_review_date: Date | null
  /**
 * *
 * The status of the order return request

 */
status: string
}
