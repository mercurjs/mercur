import { writeFileSync } from "fs"
import { startStack, type Stack } from "./src/stack/stack"
import { STACK_STATE_FILE } from "./src/stack/paths"

// The stack (in-process Medusa + two Vite servers) is started here and kept
// alive on globalThis for the whole run; globalTeardown reads it back. The
// listening sockets keep the Playwright main process from exiting early.
declare global {
  var __E2E_STACK__: Stack | undefined
}

export default async function globalSetup() {
  const stack = await startStack()
  globalThis.__E2E_STACK__ = stack

  writeFileSync(STACK_STATE_FILE, JSON.stringify(stack.urls, null, 2))

  console.log(
    `\n[e2e] stack up:\n  medusa: ${stack.urls.medusa}\n  admin:  ${stack.urls.admin}\n  vendor: ${stack.urls.vendor}\n`
  )
}
