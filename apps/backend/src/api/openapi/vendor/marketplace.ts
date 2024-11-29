/**
 * @schema VendorOrderSet
 * title: "Order Set"
 * description: "An order set object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - display_id
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the order set.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   display_id:
 *     type: number
 *     description: The display ID of the order set.
 */
