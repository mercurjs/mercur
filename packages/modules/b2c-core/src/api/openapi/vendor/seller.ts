/**
 * @schema VendorSeller
 * title: "Seller"
 * description: "A seller object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - name
 *   - handle
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
 *   members:
 *     type: array
 *     description: The members associated with the seller.
 *     items:
 *       $ref: "#/components/schemas/VendorMember"
 */

/**
 * @schema VendorMember
 * title: "Member"
 * description: "A member object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - role
 *   - email
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the member.
 *   created_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the resource was last updated.
 *   role:
 *     type: string
 *     enum: [owner, admin, member]
 *     description: The role of the member.
 *   email:
 *     type: string
 *     format: email
 *     description: The email of the member.
 *   name:
 *     type: string
 *     nullable: true
 *     description: The name of the member.
 *   bio:
 *     type: string
 *     nullable: true
 *     description: The member's biography.
 *   photo:
 *     type: string
 *     nullable: true
 *     description: URL to the member's photo.
 *   seller:
 *     $ref: "#/components/schemas/VendorSeller"
 *     description: The seller associated with the member.
 *     nullable: true
 */

/**
 * @schema VendorMemberInvite
 * title: "Member Invite"
 * description: "A member invite object with its properties"
 * required:
 *   - id
 *   - created_at
 *   - updated_at
 *   - email
 *   - role
 *   - token
 *   - expires_at
 *   - accepted
 * properties:
 *   id:
 *     type: string
 *     description: The unique identifier of the member invite.
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
 *     description: The email of the invited member.
 *   role:
 *     type: string
 *     enum: [owner, admin, member]
 *     description: The role assigned to the invited member.
 *   seller:
 *     $ref: "#/components/schemas/VendorSeller"
 *     description: The seller associated with the invite.
 *     nullable: true
 *   token:
 *     type: string
 *     description: The unique token used to accept the invite.
 *   expires_at:
 *     type: string
 *     format: date-time
 *     description: The date with timezone at which the invite expires.
 *   accepted:
 *     type: boolean
 *     description: Whether the invite has been accepted.
 */
