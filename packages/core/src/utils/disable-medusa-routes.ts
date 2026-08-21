import { join } from "path"
import { defineFileConfig } from "@medusajs/framework/utils"

import { findMedusaDirs } from "./disable-medusa-middlewares"

// Route files Mercur replaces wholesale. Medusa's `ApiLoader` builds a
// candidate `route.js`/`route.ts` path per source directory and skips the
// route when `isFileDisabled` returns true for it, so registering the config
// under the core file's absolute path takes the core handler out of the
// routing table and leaves Mercur's own file at the same URL in charge.
const DISABLED_ROUTES = ["dist/api/hooks/payment/[provider]/route.js"]

export function disableMedusaRoutes(): void {
  for (const medusaDir of findMedusaDirs()) {
    for (const file of DISABLED_ROUTES) {
      defineFileConfig({
        path: join(medusaDir, file),
        isDisabled: () => true,
      })
    }
  }
}
