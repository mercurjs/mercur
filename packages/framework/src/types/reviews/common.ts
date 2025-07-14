/**
 * *
 * @interface
 * 
 * The review details.
 * @property {string} id - The ID of the review.
 * @property {"product" | "seller"} reference - The reference of the review
 * @property {number} rating - The rating of the review
 * @property {string} customer_note - The customer note of the review
 * @property {string} customer_id - The associated customer's ID.
 * @property {string} seller_note - The seller note of the review
 * @property {Date} created_at - The associated date.
 * @property {Date} updated_at - The associated date.

 */
export type ReviewDTO = {
  /**
 * *
 * The ID of the review.

 */
id: string
  /**
 * *
 * The reference of the review

 */
reference: 'product' | 'seller'
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
  /**
 * *
 * The seller note of the review

 */
seller_note: string | null
  /**
 * *
 * The associated date.

 */
created_at: Date
  /**
 * *
 * The associated date.

 */
updated_at: Date | null
}
