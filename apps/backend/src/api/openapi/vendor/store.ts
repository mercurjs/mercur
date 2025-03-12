/**
 * @schema VendorStore
 * title: "Vendor store"
 * description: "Store object."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the store.
 *   name:
 *     type: string
 *     description: Name of the store.
 *   default_sales_channel_id:
 *     type: string
 *     description: Id of the default sales channel.
 *   default_region_id:
 *     type: string
 *     description: Id of the default region.
 *   default_location_id:
 *     type: string
 *     description: Id of the default location.
 *   supported_currencies:
 *     type: array
 *     description: List of the supported currencies.
 *     items:
 *       $ref: "#/components/schemas/VendorCurrency"
 */

/**
 * @schema VendorCurrency
 * title: "Vendor currency details"
 * description: "Currency object."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the currency.
 *   is_default:
 *     type: boolean
 *     description: Indicates if currency is default in the store.
 *   currency_code:
 *     type: string
 *     description: The currency code.
 */

/**
 * @schema VendorDateStatistics
 * title: "Vendor statistics"
 * description: "Statistics object."
 * properties:
 *   date:
 *     type: string
 *     description: Timestamp of the count
 *   count:
 *     type: string
 *     description: Count of the records
 */
