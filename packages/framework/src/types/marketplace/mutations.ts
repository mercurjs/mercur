/**
 * *
 * @interface
 * 
 * The order set to be created.
 * @property {string} cart_id - The associated cart's ID.
 * @property {string} customer_id - The associated customer's ID.
 * @property {string} payment_collection_id - The associated payment collection's ID.
 * @property {string} sales_channel_id - The associated sales channel's ID.

 */
export type CreateOrderSetDTO = {
  /**
 * *
 * The associated cart's ID.

 */
cart_id: string
  /**
 * *
 * The associated customer's ID.

 */
customer_id: string
  /**
 * *
 * The associated payment collection's ID.

 */
payment_collection_id: string
  /**
 * *
 * The associated sales channel's ID.

 */
sales_channel_id: string
}
