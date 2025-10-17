/**
 * @schema AdminSeller
 * title: "Seller"
 * description: "Seller object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the seller.
 *   store_status:
 *     type: string
 *     enum: [active, inactive, suspended]
 *     description: The status of the seller's store.
 *   name:
 *     type: string
 *     description: The name of the seller.
 *   handle:
 *     type: string
 *     description: A unique handle for the seller.
 *   description:
 *     type: string
 *     nullable: true
 *     description: A description of the seller.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the seller's photo.
 *   email:
 *     type: string
 *     nullable: true
 *     description: Store contact email.
 *   phone:
 *     type: string
 *     nullable: true
 *     description: Store contact phone.
 *   address_line:
 *     type: string
 *     nullable: true
 *     description: Seller address line.
 *   city:
 *     type: string
 *     nullable: true
 *     description: Seller city.
 *   state:
 *     type: string
 *     nullable: true
 *     description: Seller state.
 *   postal_code:
 *     type: string
 *     nullable: true
 *     description: Seller postal code.
 *   country_code:
 *     type: string
 *     nullable: true
 *     description: Seller country code.
 *   tax_id:
 *     type: string
 *     nullable: true
 *     description: Seller tax ID.
 *   members:
 *     type: array
 *     description: Array of members associated with the seller.
 *     items:
 *       type: object
 *       description: Member object with details.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */

/**
 * @schema AdminSellerInvitation
 * title: "SellerInvitation"
 * description: "Seller invitation object"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the invitation.
 *   email:
 *     type: string
 *     description: The email address of the invited seller.
 *   registration_url:
 *     type: string
 *     description: The registration URL for the invitation.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 */
