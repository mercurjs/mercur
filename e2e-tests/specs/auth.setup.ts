import { test as setup, expect } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  createSeller,
  openSession,
  registerMember,
  selectSeller,
} from "../helpers/api"
import {
  generateMemberCredentials,
  generateSeller,
} from "../helpers/test-data"

const STORAGE_PATH = path.resolve(process.cwd(), ".auth/vendor.json")
const CONTEXT_PATH = path.resolve(process.cwd(), ".auth/vendor-context.json")

setup("create vendor + persist storage state", async ({ page, request }) => {
  mkdirSync(path.dirname(STORAGE_PATH), { recursive: true })

  // 1. Register a fresh member identity against the API.
  const credentials = generateMemberCredentials()
  const member = await registerMember(request, credentials)

  // 2. Exchange the bearer token for a session cookie on the API origin.
  await openSession(request, member.token)

  // 3. Create the seller record so the member has somewhere to land.
  const seller = await createSeller(
    request,
    generateSeller({ member_email: credentials.email }),
  )

  // Persist context (seller id) so fixtures can inject x-seller-id into API
  // calls. Vendor routes refuse traffic without it.
  writeFileSync(CONTEXT_PATH, JSON.stringify({ sellerId: seller.id }, null, 2))

  // 4. Drive the SPA login once to mint cookies on the vendor origin and
  //    populate any localStorage the dashboard expects post-auth.
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(credentials.email)
  await page.getByLabel(/password/i).fill(credentials.password)
  await page.getByRole("button", { name: /sign in|log in|continue/i }).click()

  // The vendor SPA lands on `/` (or `/store-select`) after a successful login;
  // either way we wait until we're no longer on `/login`.
  await expect(page).not.toHaveURL(/\/login$/)

  // 5. Stamp the selected seller onto the browser session. `page.request`
  //    shares cookies with the browser, so this updates `req.session.seller_id`
  //    on the same session the SPA reads in `useMe()`.
  await selectSeller(page.request, seller.id)

  // 6. Persist cookies + localStorage so every test inherits this session.
  await page.context().storageState({ path: STORAGE_PATH })
})
