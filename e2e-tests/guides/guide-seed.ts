import { writeFileSync } from "fs"
import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import Scrypt from "scrypt-kdf"
import { createCommissionRatesWorkflow } from "@mercurjs/core/workflows"
import {
  CommissionRateType,
  MercurModules,
  type CreateCommissionRateDTO,
} from "@mercurjs/types"
import { createAdminUser } from "../helpers/create-admin-user"
import seedDemoData from "../../apps/api/src/scripts/seed"
import { GUIDE_ADMIN, GUIDE_CUSTOMER, GUIDE_SELLER } from "./credentials"
import { ORDER_SEED_FILE } from "./paths"

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

  await seedCommissionRule(container)
  await stashOrderPrereqs(container)
}

// Creates one commission rule (a rate scoped to the demo seller) so the
// "manage a commission rule" guide has a rule to show in the list.
async function seedCommissionRule(container: MedusaContainer): Promise<void> {
  const sellerModule = container.resolve<{
    listSellers: (filter: object) => Promise<Array<{ id: string; name: string }>>
  }>(MercurModules.SELLER)
  const sellers = await sellerModule.listSellers({})
  const seller =
    sellers.find((s) => s.name === GUIDE_SELLER.store) ?? sellers[0]
  if (!seller) {
    return
  }

  const rate = {
    name: `${seller.name} commission`,
    type: CommissionRateType.PERCENTAGE,
    value: 12,
    is_enabled: true,
    is_default: false,
    rules: [{ reference: "seller", reference_id: seller.id }],
  }
  await createCommissionRatesWorkflow(container).run({
    input: [rate as unknown as CreateCommissionRateDTO],
  })
}

// Creates a storefront customer and captures the publishable key, writing both
// to ORDER_SEED_FILE. global-setup reads this after the server is up and places
// an order over the store API (the checkout endpoints are HTTP-only), so the
// vendor order guides have a real order to screenshot.
async function stashOrderPrereqs(container: MedusaContainer): Promise<void> {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const keys = await apiKeyModule.listApiKeys({ type: "publishable" })
  const publishableKey = keys[0]?.token
  if (!publishableKey) {
    return
  }

  const authModule = container.resolve(Modules.AUTH)
  const customerModule = container.resolve(Modules.CUSTOMER)

  const customer = await customerModule.createCustomers({
    email: GUIDE_CUSTOMER.email,
    first_name: GUIDE_CUSTOMER.first_name,
    last_name: GUIDE_CUSTOMER.last_name,
  })

  const passwordHash = await Scrypt.kdf(GUIDE_CUSTOMER.password, {
    logN: 15,
    r: 8,
    p: 1,
  })
  const authIdentity = await authModule.createAuthIdentities({
    provider_identities: [
      {
        provider: "emailpass",
        entity_id: GUIDE_CUSTOMER.email,
        provider_metadata: { password: passwordHash.toString("base64") },
      },
    ],
    app_metadata: { customer_id: customer.id },
  })

  const config = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { jwtSecret, jwtOptions } = config.projectConfig.http
  const customerToken = jwt.sign(
    {
      actor_id: customer.id,
      actor_type: "customer",
      auth_identity_id: authIdentity.id,
    },
    jwtSecret as string,
    { expiresIn: "1d", ...jwtOptions }
  )

  writeFileSync(ORDER_SEED_FILE, JSON.stringify({ publishableKey, customerToken }))
}
