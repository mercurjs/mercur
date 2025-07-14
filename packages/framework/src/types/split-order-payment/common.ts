/**
 * *
 * @interface
 * 
 * The split order payment details.
 * @property {string} id - The ID of the split order payment.
 * @property {string} status - The status of the split order payment
 * @property {string} currency_code - The currency code of the split order payment
 * @property {number} authorized_amount - The authorized amount of the split order payment
 * @property {number} captured_amount - The captured amount of the split order payment
 * @property {number} refunded_amount - The refunded amount of the split order payment
 * @property {string} payment_collection_id - The associated payment collection's ID.

 */
export type SplitOrderPaymentDTO = {
  /**
 * *
 * The ID of the split order payment.

 */
id: string
  /**
 * *
 * The status of the split order payment

 */
status: string
  /**
 * *
 * The currency code of the split order payment

 */
currency_code: string
  /**
 * *
 * The authorized amount of the split order payment

 */
authorized_amount: number
  /**
 * *
 * The captured amount of the split order payment

 */
captured_amount: number
  /**
 * *
 * The refunded amount of the split order payment

 */
refunded_amount: number
  /**
 * *
 * The associated payment collection's ID.

 */
payment_collection_id: string
}
