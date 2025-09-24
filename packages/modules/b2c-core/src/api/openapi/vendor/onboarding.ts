/**
 * @schema VendorSellerOnboarding
 * title: "SellerOnboarding"
 * description: "An onboarding object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - name
 *   - handle
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the onboarding.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   seller_id:
 *     type: string
 *     description: The unique identifier of the seller.
 *   store_information:
 *     type: boolean
 *     description: Indicates if seller completed store information.
 *   stripe_connection:
 *     type: boolean
 *     description: Indicates if seller completed stripe connection.
 *   locations_shipping:
 *     type: boolean
 *     description: Indicates if seller added shipping locations.
 *   products:
 *     type: boolean
 *     description: Indicates if seller added products.
 */
