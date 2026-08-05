import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { createAdminUser } from "../helpers/create-admin-user"
import seedDemoData from "../../apps/api/src/scripts/seed"
import { GUIDE_ADMIN } from "./credentials"

// Seeds the ephemeral DB for the docs guide generator. Unlike the minimal
// login-only e2e seed, this loads the full apps/api demo catalog (sellers,
// products, offers, categories, attributes) so screenshots show realistic
// marketplace data. The demo seed does not create an operator, so an admin user
// is created first for the admin-panel guides; the vendor-panel guides log in as
// the primary demo seller (seller@mercur.dev), which the demo seed registers.
export async function seedGuides(container: MedusaContainer): Promise<void> {
  await createAdminUser(null, { headers: {} }, container, {
    email: GUIDE_ADMIN.email,
  })

  await seedDemoData({ container, args: [] } as ExecArgs)
}
