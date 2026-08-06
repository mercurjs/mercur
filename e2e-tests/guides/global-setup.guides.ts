import { writeFileSync } from "fs"
import { startStack, type Stack } from "../src/stack/stack"
import { STACK_STATE_FILE } from "../src/stack/paths"

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
}
