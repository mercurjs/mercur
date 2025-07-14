/**
 * *
 * @interface
 * 
 * The review to be created.
 * @property {string} order_id - The associated order's ID.
 * @property {"product" | "seller"} reference - The reference of the review
 * @property {string} reference_id - The associated reference's ID.
 * @property {number} rating - The rating of the review
 * @property {string} customer_note - The customer note of the review
 * @property {string} customer_id - The associated customer's ID.

 */
export type CreateReviewDTO = {
  /**
 * *
 * The associated order's ID.

 */
order_id: string
  /**
 * *
 * The reference of the review

 */
reference: 'product' | 'seller'
  /**
 * *
 * The associated reference's ID.

 */
reference_id: string
  /**
 * *
 * The rating of the review

 */
rating: number
  /**
 * *
 * The customer note of the review

 */
customer_note: string | null
  /**
 * *
 * The associated customer's ID.

 */
customer_id: string
}

/**
 * *
 * @interface
 * 
 * The attributes to update in the review.
 * @property {string} id - The ID of the review.
 * @property {number} rating - The rating of the review
 * @property {string} customer_note - The customer note of the review
 * @property {string} seller_note - The seller note of the review

 */
export type UpdateReviewDTO = {
  /**
 * *
 * The ID of the review.

 */
id: string
  /**
 * *
 * The rating of the review

 */
rating?: number
  /**
 * *
 * The customer note of the review

 */
customer_note?: string
  /**
 * *
 * The seller note of the review

 */
seller_note?: string
}
