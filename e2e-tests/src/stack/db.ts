import { execFileSync } from "child_process"
import { TestDatabaseUtils } from "@medusajs/test-utils"
import { E2E_ROOT } from "./paths"

export interface EphemeralDb {
  name: string
  url: string
  snapshot: () => Promise<void>
  restore: () => Promise<void>
  drop: () => Promise<void>
}

// Mirrors medusaIntegrationTestRunner: create a random-named database from the
// DB_* connection, migrate core + links, keep a template for fast reseed.
export async function createEphemeralDb(env: NodeJS.ProcessEnv): Promise<EphemeralDb> {
  const name = `mercur_e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  const templateName = `${name}_template`
  const url = TestDatabaseUtils.getDatabaseURL(name)

  const dbUtils = TestDatabaseUtils.dbTestUtilFactory()
  await dbUtils.create(name)

  // Migrations + link sync run against the freshly created database. The medusa
  // CLI is invoked once (build step, not a long-running server) with the e2e
  // project as its directory so it loads e2e-tests/medusa-config.ts.
  execFileSync("medusa", ["db:migrate"], {
    cwd: E2E_ROOT,
    env: { ...env, DATABASE_URL: url },
    stdio: "inherit",
  })

  return {
    name,
    url,
    snapshot: () => dbUtils.snapshot({ databaseName: name, templateName }),
    restore: () => dbUtils.restore({ databaseName: name, templateName }),
    drop: async () => {
      await dbUtils.shutdown(name)
      dropDatabase(name, env)
    },
  }
}

// dbUtils.shutdown only closes the pool; the database itself must be dropped
// explicitly or ephemeral DBs pile up. WITH (FORCE) terminates any stragglers.
function dropDatabase(name: string, env: NodeJS.ProcessEnv): void {
  const host = env.DB_HOST ?? "localhost"
  const port = env.DB_PORT ?? "5432"
  const user = env.DB_USERNAME ?? "postgres"
  execFileSync(
    "psql",
    ["-h", host, "-p", port, "-U", user, "-d", "postgres", "-c", `DROP DATABASE IF EXISTS "${name}" WITH (FORCE);`],
    { env: { ...env, PGPASSWORD: env.DB_PASSWORD ?? "" }, stdio: "ignore" }
  )
}
