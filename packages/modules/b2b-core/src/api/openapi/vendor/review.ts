/**
 * @schema Review
 * title: "Seller/product review"
 * description: "A product/seller review with rating and comment"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the review.
 *   rating:
 *     type: number
 *     description: The rating associated with the review.
 *   reference:
 *     type: string
 *     enum: [seller, product]
 *     description: Indicates if review reference is seller or product
 *   customer_note:
 *     type: string
 *     nullable: true
 *     description: Customer comment on resource
 *   customer_id:
 *     type: string
 *     description: Id of the customer who left the review
 *   seller_note:
 *     type: string
 *     nullable: true
 *     description: Seller response to customer review
 */
