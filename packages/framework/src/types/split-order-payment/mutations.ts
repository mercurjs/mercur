/**
 * *
 * @interface
 * 
 * The split order payments to be created.
 * @property {string} order_id - The associated order's ID.
 * @property {string} status - The status of the split order payments
 * @property {string} currency_code - The currency code of the split order payments
 * @property {number} authorized_amount - The authorized amount of the split order payments
 * @property {string} payment_collection_id - The associated payment collection's ID.

 */
export type CreateSplitOrderPaymentsDTO = {
  /**
 * *
 * The associated order's ID.

 */
order_id: string
  /**
 * *
 * The status of the split order payments

 */
status: string
  /**
 * *
 * The currency code of the split order payments

 */
currency_code: string
  /**
 * *
 * The authorized amount of the split order payments

 */
authorized_amount: number
  /**
 * *
 * The associated payment collection's ID.

 */
payment_collection_id: string
}

/**
 * *
 * @interface
 * 
 * The attributes to update in the split order payments.
 * @property {string} id - The ID of the split order payments.
 * @property {string} status - The status of the split order payments
 * @property {number} authorized_amount - The authorized amount of the split order payments
 * @property {number} captured_amount - The captured amount of the split order payments
 * @property {number} refunded_amount - The refunded amount of the split order payments

 */
export type UpdateSplitOrderPaymentsDTO = {
  /**
 * *
 * The ID of the split order payments.

 */
id: string
  /**
 * *
 * The status of the split order payments

 */
status?: string
  /**
 * *
 * The authorized amount of the split order payments

 */
authorized_amount?: number
  /**
 * *
 * The captured amount of the split order payments

 */
captured_amount?: number
  /**
 * *
 * The refunded amount of the split order payments

 */
refunded_amount?: number
}

/**
 * *
 * @interface
 * 
 * The refund split order payments details.
 * @property {string} id - The ID of the refund split order payments.
 * @property {number} amount - The amount of the refund split order payments

 */
export type RefundSplitOrderPaymentsDTO = {
  /**
 * *
 * The ID of the refund split order payments.

 */
id: string
  /**
 * *
 * The amount of the refund split order payments

 */
amount: number
}
