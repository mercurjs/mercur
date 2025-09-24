/**
 * @schema VendorCustomer
 * title: "VendorCustomer"
 * description: "Customer who placed an order in sellers store."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the customer.
 *   company_name:
 *     type: string
 *     nullable: true
 *     description: Company name
 *   first_name:
 *     type: string
 *     description: First name
 *   last_name:
 *     type: string
 *     description: Last name
 *   email:
 *     type: string
 *     description: Email
 *   phone:
 *     type: string
 *     nullable: true
 *     description: Phone number
 *   has_account:
 *     type: boolean
 *     description: Indicates if customer has account
 *   groups:
 *     type: array
 *     description: The customer's groups.
 *     items:
 *       $ref: '#/components/schemas/VendorCustomerGroup'
 */

/**
 * @schema VendorCustomerGroup
 * title: "VendorCustomerGroup"
 * description: "Customer group details."
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the customer.
 *   name:
 *     type: string
 *     nullable: true
 *     description: Company name
 */
