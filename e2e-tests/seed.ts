import type { MedusaContainer } from "@medusajs/framework/types"
import { createAdminUser } from "./helpers/create-admin-user"
import { createSellerUser } from "./helpers/create-seller-user"

// Known credentials the journeys log in with. Both helpers set the password to
// "somepassword"; the admin email is admin@medusa.js, the seller seller@medusa.js.
export const E2E_ADMIN = { email: "admin@medusa.js", password: "somepassword" }
export const E2E_SELLER = { email: "seller@medusa.js", password: "somepassword" }

export async function seed(container: MedusaContainer): Promise<void> {
  await createAdminUser(null, { headers: {} }, container, {
    email: E2E_ADMIN.email,
  })
  await createSellerUser(container, {
    email: E2E_SELLER.email,
    name: "E2E Seller",
  })
}
