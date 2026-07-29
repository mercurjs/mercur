import { resolve } from "path"

export const E2E_ROOT = resolve(__dirname, "..", "..")
export const ADMIN_HOST_DIR = resolve(E2E_ROOT, "hosts", "admin")
export const VENDOR_HOST_DIR = resolve(E2E_ROOT, "hosts", "vendor")
export const MEDUSA_CONFIG_PATH = resolve(E2E_ROOT, "medusa-config.ts")
export const STACK_STATE_FILE = resolve(E2E_ROOT, ".stack.json")
