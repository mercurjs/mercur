import { rmSync } from "fs"
import { STACK_STATE_FILE } from "./src/stack/paths"
import type { Stack } from "./src/stack/stack"

export default async function globalTeardown() {
  const stack = globalThis.__E2E_STACK__ as Stack | undefined
  if (stack) {
    await stack.shutdownAll()
  }
  rmSync(STACK_STATE_FILE, { force: true })
}
