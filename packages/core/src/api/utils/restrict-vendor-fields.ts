import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"

/**
 * Relations a vendor request must never traverse. The marketplace links
 * products, categories and customers to many sellers at once, so a `fields`
 * query that walks through `sellers` (or a member's other `seller_members`)
 * lands on a seller the request is not scoped to. The private seller
 * relations are blocked everywhere except on the routes rooted at the
 * authenticated seller itself.
 */
export const VENDOR_CROSS_SELLER_FIELD_SEGMENTS = [
  "sellers",
  "seller_members",
  "token",
]

export const VENDOR_SELLER_PRIVATE_FIELD_SEGMENTS = [
  ...VENDOR_CROSS_SELLER_FIELD_SEGMENTS,
  "payment_details",
  "professional_details",
  "member_invites",
  "members",
]

export const restrictVendorFields =
  (disallowed: string[]) =>
  (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    req.disallowed = disallowed
    next()
  }
