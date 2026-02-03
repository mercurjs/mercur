/**
 * @schema StoreCustomer
 * title: "Customer"
 * description: "A customer object with its properties including profile avatar"
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the customer.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   email:
 *     type: string
 *     format: email
 *     description: The customer's email address.
 *   first_name:
 *     type: string
 *     description: The customer's first name.
 *   last_name:
 *     type: string
 *     description: The customer's last name.
 *   phone:
 *     type: string
 *     nullable: true
 *     description: The customer's phone number.
 *   company_name:
 *     type: string
 *     nullable: true
 *     description: The customer's company name.
 *   has_account:
 *     type: boolean
 *     description: Whether the customer has an account.
 *   avatar:
 *     type: object
 *     nullable: true
 *     description: The customer's profile avatar image.
 *     properties:
 *       id:
 *         type: string
 *         description: The unique identifier of the file.
 *       url:
 *         type: string
 *         description: The URL to access the avatar image.
 *       mime_type:
 *         type: string
 *         description: The MIME type of the avatar image.
 */
