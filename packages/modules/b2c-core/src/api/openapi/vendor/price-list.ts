/**
 * @schema VendorPriceList
 * type: object
 * description: The price list's details.
 * x-schemaName: VendorPriceList
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The price list's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The price list's title.
 *   description:
 *     type: string
 *     title: description
 *     description: The price list's description.
 *   rules:
 *     type: object
 *     description: The price list's rules.
 *   starts_at:
 *     type: string
 *     title: starts_at
 *     description: The date the price list starts.
 *   ends_at:
 *     type: string
 *     title: ends_at
 *     description: The date the price list ends.
 *   status:
 *     type: string
 *     description: The price list's status.
 *     enum:
 *       - draft
 *       - active
 *   type:
 *     type: string
 *     description: The price list's type.
 *     enum:
 *       - sale
 *       - override
 *   prices:
 *     type: array
 *     description: The price list's prices.
 *     items:
 *       $ref: "#/components/schemas/VendorPriceListPrice"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the price list was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the price list was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the price list was deleted.
 */

/**
 * @schema VendorPriceListPrice
 * type: object
 * description: The details of a price list's price.
 * x-schemaName: VendorPriceListPrice
 * properties:
 *   variant_id:
 *     type: string
 *     title: variant_id
 *     description: The ID of the product variant this price list is for.
 *   rules:
 *     type: object
 *     description: The price's rules.
 *   id:
 *     type: string
 *     title: id
 *     description: The price's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The price's title.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The price's currency code.
 *     example: usd
 *   amount:
 *     type: number
 *     title: amount
 *     description: The price's amount.
 *   raw_amount:
 *     type: object
 *     description: The price's raw amount.
 *   min_quantity:
 *     type: number
 *     title: min_quantity
 *     description: The minimum quantity that must be available in the cart for the price to be applied.
 *   max_quantity:
 *     type: number
 *     title: max_quantity
 *     description: The maximum quantity allowed to be available in the cart for the price to be applied.
 *   price_set_id:
 *     type: string
 *     title: price_set_id
 *     description: The ID of the price set this price belongs to.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the price was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the price was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the price was deleted.
 */
