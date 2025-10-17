/**
 * @schema StoreSeller
 * title: "Seller"
 * description: "A seller object with its properties"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the seller.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   name:
 *     type: string
 *     description: The name of the seller.
 *   description:
 *     type: string
 *     nullable: true
 *     description: A description of the seller.
 *   handle:
 *     type: string
 *     description: A unique handle for the seller.
 *   email:
 *     type: string
 *     nullable: true
 *     description: Store contact email.
 *   phone:
 *     type: string
 *     nullable: true
 *     description: Store contact phone.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the seller's photo.
 *   address_line:
 *     type: string
 *     nullable: true
 *     description: Seller address line.
 *   postal_code:
 *     type: string
 *     nullable: true
 *     description: Seller postal code.
 *   city:
 *     type: string
 *     nullable: true
 *     description: Seller city.
 *   state:
 *     type: string
 *     nullable: true
 *     description: Seller state.
 *   country_code:
 *     type: string
 *     nullable: true
 *     description: Seller country code.
 *   tax_id:
 *     type: string
 *     nullable: true
 *     description: Seller tax id.
 */
