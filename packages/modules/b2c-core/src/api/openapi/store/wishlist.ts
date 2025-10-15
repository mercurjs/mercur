/**
 * @schema Wishlist
 * title: "Wishlist Response"
 * description: "A response object containing a list of wishlists and pagination details."
 * properties:
 *   wishlists:
 *     type: array
 *     description: A list of wishlists.
 *     items:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the wishlist.
 *         products:
 *           type: array
 *           description: A list of products in the wishlist.
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 nullable: true
 *                 description: The unique identifier of the product.
 *               title:
 *                 type: string
 *                 nullable: true
 *                 description: The title of the product.
 *               handle:
 *                 type: string
 *                 nullable: true
 *                 description: The unique handle of the product.
 *               subtitle:
 *                 type: string
 *                 nullable: true
 *                 description: The subtitle of the product.
 *               description:
 *                 type: string
 *                 nullable: true
 *                 description: The description of the product.
 *               is_giftcard:
 *                 type: boolean
 *                 nullable: true
 *                 description: Indicates if the product is a gift card.
 *               status:
 *                 type: string
 *                 nullable: true
 *                 description: The status of the product.
 *               thumbnail:
 *                 type: string
 *                 nullable: true
 *                 description: URL of the product thumbnail.
 *               weight:
 *                 type: number
 *                 nullable: true
 *                 description: Weight of the product.
 *               length:
 *                 type: number
 *                 nullable: true
 *                 description: Length of the product.
 *               height:
 *                 type: number
 *                 nullable: true
 *                 description: Height of the product.
 *               width:
 *                 type: number
 *                 nullable: true
 *                 description: Width of the product.
 *               origin_country:
 *                 type: string
 *                 nullable: true
 *                 description: Country of origin.
 *               hs_code:
 *                 type: string
 *                 nullable: true
 *                 description: Harmonized System code.
 *               mid_code:
 *                 type: string
 *                 nullable: true
 *                 description: Manufacturer Identification code.
 *               material:
 *                 type: string
 *                 nullable: true
 *                 description: Material of the product.
 *               discountable:
 *                 type: boolean
 *                 nullable: true
 *                 description: Indicates if the product is discountable.
 *               external_id:
 *                 type: string
 *                 nullable: true
 *                 description: External identifier.
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional metadata.
 *               type_id:
 *                 type: string
 *                 nullable: true
 *                 description: Product type identifier.
 *               type:
 *                 type: string
 *                 nullable: true
 *                 description: Product type.
 *               collection_id:
 *                 type: string
 *                 nullable: true
 *                 description: Collection identifier.
 *               collection:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Collection ID.
 *               created_at:
 *                 type: string
 *                 format: date-time
 *                 description: The date with timezone when the product was created.
 *               updated_at:
 *                 type: string
 *                 format: date-time
 *                 description: The date with timezone when the product was last updated.
 *               deleted_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: The date with timezone when the product was deleted.
 *               variant_id:
 *                 type: string
 *                 nullable: true
 *                 description: Variant identifier.
 *               price_set_id:
 *                 type: string
 *                 nullable: true
 *                 description: Price set identifier.
 *               currency_code:
 *                 type: string
 *                 nullable: true
 *                 description: Currency code.
 *               calculated_amount:
 *                 type: number
 *                 nullable: true
 *                 description: Calculated amount for the product.
 */
