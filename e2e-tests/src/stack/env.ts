import { config as loadDotenv } from "dotenv"
import { resolve } from "path"
import { E2E_ROOT } from "./paths"

let loaded = false

export function loadEnv(): void {
  if (loaded) {
    return
  }
  loadDotenv({ path: resolve(E2E_ROOT, ".env.test") })
  loaded = true
}
