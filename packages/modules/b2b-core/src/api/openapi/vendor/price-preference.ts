/**
 * @schema VendorPricePreference
 * title: "Vendor Price Preference"
 * description: "A price preference configuration for vendors."
 * type: object
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier for the price preference.
 *     example: "pp_01H9Z8K2N3M4P5Q6R7S8T9U0V"
 *   attribute:
 *     type: string
 *     description: The attribute name for the price preference.
 *     example: "color"
 *   value:
 *     type: string
 *     description: The value of the attribute for the price preference.
 *     example: "red"
 *   is_tax_inclusive:
 *     type: boolean
 *     description: Whether the price preference is tax inclusive.
 *     example: true
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date and time when the price preference was created.
 *     example: "2023-01-01T00:00:00.000Z"
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date and time when the price preference was last updated.
 *     example: "2023-01-01T00:00:00.000Z"
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     nullable: true
 *     description: The date and time when the price preference was deleted.
 *     example: null
 * required:
 *   - id
 *   - attribute
 *   - value
 *   - is_tax_inclusive
 *   - created_at
 *   - updated_at
 */
