import { loadEnv } from "./env"
import { createEphemeralDb, type EphemeralDb } from "./db"
import { startMedusa, type MedusaHandle } from "./medusa"
import { startDashboard, type DashboardHandle } from "./dashboard"
import { runSeed, DEFAULT_SEED_EXEC } from "./seed"
import { ADMIN_HOST_DIR, VENDOR_HOST_DIR } from "./paths"

export interface StartStackOptions {
  // `medusa exec` entry (relative to e2e-tests/) that seeds the ephemeral DB.
  // Defaults to the minimal login-only e2e seed; the docs guide generator
  // passes its own entry to seed the apps/api demo catalog.
  seedExec?: string
}

export interface Stack {
  medusa: MedusaHandle
  admin: DashboardHandle
  vendor: DashboardHandle
  db: EphemeralDb
  urls: { medusa: string; admin: string; vendor: string }
  reseed: () => Promise<void>
  shutdownAll: () => Promise<void>
}

export async function startStack(
  options: StartStackOptions = {}
): Promise<Stack> {
  const seedExec = options.seedExec ?? DEFAULT_SEED_EXEC
  loadEnv()

  const getPort = (await import("get-port")).default
  // All three ports are chosen up front so Medusa can boot with CORS that
  // already allows the dashboard origins (the config reads *_CORS at load time).
  const medusaPort = await getPort()
  const adminPort = await getPort({ exclude: [medusaPort] })
  const vendorPort = await getPort({ exclude: [medusaPort, adminPort] })
  const adminOrigin = `http://localhost:${adminPort}`
  const vendorOrigin = `http://localhost:${vendorPort}`

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "test",
    STORE_CORS: "*",
    ADMIN_CORS: adminOrigin,
    VENDOR_CORS: vendorOrigin,
    AUTH_CORS: `${adminOrigin},${vendorOrigin}`,
  }

  const db = await createEphemeralDb(env)
  env.DATABASE_URL = db.url

  runSeed(env, seedExec)

  const medusa = await startMedusa(env, medusaPort)

  const admin = await startDashboard({
    root: ADMIN_HOST_DIR,
    port: adminPort,
    backendUrl: medusa.url,
    vendorUrl: vendorOrigin,
  })
  const vendor = await startDashboard({
    root: VENDOR_HOST_DIR,
    port: vendorPort,
    backendUrl: medusa.url,
  })

  const shutdownAll = async () => {
    await Promise.allSettled([admin.close(), vendor.close()])
    await medusa.shutdown()
    await db.drop()
  }

  const reseed = async () => {
    await db.restore()
    runSeed(env, seedExec)
  }

  return {
    medusa,
    admin,
    vendor,
    db,
    urls: { medusa: medusa.url, admin: admin.url, vendor: vendor.url },
    reseed,
    shutdownAll,
  }
}
