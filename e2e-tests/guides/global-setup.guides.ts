import { existsSync, readFileSync, writeFileSync } from "fs"
import { startStack, type Stack } from "../src/stack/stack"
import { STACK_STATE_FILE } from "../src/stack/paths"
import { ORDER_SEED_FILE } from "./paths"
import { seedOrder, type OrderSeedInput } from "./seed-order"

// Same stack as the e2e journeys, but seeded with the apps/api demo catalog so
// generated screenshots show realistic marketplace data (see guide-seed.ts).
declare global {
  var __GUIDE_STACK__: Stack | undefined
}

export default async function globalSetup() {
  const stack = await startStack({ seedExec: "./guides/guide-seed-exec.ts" })
  globalThis.__GUIDE_STACK__ = stack

  writeFileSync(STACK_STATE_FILE, JSON.stringify(stack.urls, null, 2))

  console.log(
    `\n[guides] stack up:\n  medusa: ${stack.urls.medusa}\n  admin:  ${stack.urls.admin}\n  vendor: ${stack.urls.vendor}\n`
  )

  // Place an order over the store API so the vendor order guides have real data.
  // The checkout is HTTP-only and needs the running server, so it happens here
  // (not in guide-seed). A failure is logged but does not abort the run: the
  // non-order guides still generate.
  if (existsSync(ORDER_SEED_FILE)) {
    try {
      const input = JSON.parse(
        readFileSync(ORDER_SEED_FILE, "utf-8")
      ) as OrderSeedInput
      await seedOrder(stack.urls.medusa, input)
      console.log("[guides] seeded a store order for the order guides")
    } catch (error) {
      console.error("[guides] order seed failed:", (error as Error).message)
    }
  }
}
