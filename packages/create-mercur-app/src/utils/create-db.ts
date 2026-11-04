import {
  checkPostgres,
  classifyPostgresError,
  hostAndPort,
  printPostgresFix,
} from "./check-postgres";
import { getPackageManager } from "./get-package-manager";
import { logger } from "./logger";
import { manageEnvFiles } from "./manage-env-files";
import { markDemoDataSeeded } from "./mark-demo-data";
import { spinner } from "./spinner";
import { execa } from "execa";
import type { Ora } from "ora";
import path from "path";
import pg from "pg";
import prompts from "prompts";

const DEFAULT_DB_HOST = "localhost";
const DEFAULT_DB_PORT = 5432;
const API_DIR = "packages/api";
const ADMIN_EMAIL = "admin@mercur-test.com";

interface DbSetupArgs {
  projectDir: string;
  spinner?: Ora;
}

export interface PreparedDatabase {
  dbName: string;
  connectionString: string;
}

export interface SetupDatabaseResult {
  success: boolean;
  dbName: string;
  connectionString: string | null;
  inviteToken?: string | null;
  publishableKey?: string | null;
}

/**
 * Resolves credentials and creates the project database before anything is
 * downloaded or installed, so a missing or misconfigured PostgreSQL fails in
 * seconds instead of after the dependency install.
 */
export async function prepareDatabase(args: {
  projectName: string;
  dbConnectionString?: string;
  dbHost?: string;
  dbPort?: number;
  spinner?: Ora;
}): Promise<PreparedDatabase | null> {
  const host = args.dbHost ?? DEFAULT_DB_HOST;
  const port = args.dbPort ?? DEFAULT_DB_PORT;

  if (args.dbConnectionString) {
    const check = await checkPostgres({ connectionString: args.dbConnectionString });
    if (!check.ok) {
      args.spinner?.stop();
      printPostgresFix(check, hostAndPort(args.dbConnectionString, { host, port }));
      return null;
    }
    return {
      dbName: databaseNameOf(args.dbConnectionString) ?? args.projectName,
      connectionString: args.dbConnectionString,
    };
  }

  const credentials = await resolveCredentials({ host, port, spinner: args.spinner });
  if (!credentials) {
    return null;
  }

  const { client } = credentials;
  try {
    const dbName = await pickDatabaseName(
      client,
      args.projectName.replace(/[^a-zA-Z0-9]/g, "-"),
      args.spinner
    );
    if (!dbName) {
      return null;
    }

    if (args.spinner) {
      args.spinner.text = `Creating database "${dbName}"...`;
    }
    await client.query(`CREATE DATABASE "${dbName}"`);

    return {
      dbName,
      connectionString: formatConnectionString({
        user: credentials.user,
        password: credentials.password,
        host,
        port,
        db: dbName,
      }),
    };
  } catch (err) {
    args.spinner?.stop();
    logger.error(
      `Error creating database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return null;
  } finally {
    await client.end().catch(() => {});
  }
}

export async function initializeDatabase(
  args: DbSetupArgs & PreparedDatabase
): Promise<SetupDatabaseResult> {
  const { projectDir, spinner, dbName, connectionString } = args;

  // Medusa needs DATABASE_URL in .env before running migrations
  await manageEnvFiles({
    projectDir,
    databaseUri: connectionString,
  });

  const migrated = await runMigrations({ projectDir, spinner, connectionString });
  if (!migrated) {
    return { success: false, dbName, connectionString: null };
  }

  const seeded = await seedDatabase({ projectDir, spinner });
  if (!seeded) {
    return { success: false, dbName, connectionString: null };
  }

  await markDemoDataSeeded({ connectionString });

  const inviteToken = await createAdminInvite({ projectDir });

  const publishableKey = await getPublishableKey({ connectionString });

  // Now that the storefront .env exists, inject the seeded publishable key.
  if (publishableKey) {
    await manageEnvFiles({
      projectDir,
      databaseUri: connectionString,
      publishableKey,
    });
  }

  return {
    success: true,
    dbName,
    connectionString,
    inviteToken,
    publishableKey,
  };
}

async function getPublishableKey({
  connectionString,
}: {
  connectionString: string;
}): Promise<string | null> {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    const result = await client.query(
      `SELECT token FROM api_key WHERE type = 'publishable' AND revoked_at IS NULL AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1;`
    );
    return result.rows[0]?.token ?? null;
  } catch (err) {
    logger.error(
      `Error reading publishable API key${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return null;
  } finally {
    await client.end().catch(() => {});
  }
}

interface Credentials {
  client: pg.Client;
  user: string;
  password: string;
}

/**
 * Connects to the `postgres` maintenance database, falling back to the
 * connection's default database (Postgres resolves it to the username) on
 * servers where `postgres` was dropped.
 */
async function connectToMaintenanceDb(connection: {
  user: string;
  password: string;
  host: string;
  port: number;
}): Promise<pg.Client> {
  const connect = async (database?: string) => {
    const client = new pg.Client({ ...connection, database, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      throw err;
    }
  };

  try {
    return await connect("postgres");
  } catch (err) {
    if (classifyPostgresError(err).reason !== "missing-database") {
      throw err;
    }
    return connect();
  }
}

async function resolveCredentials({
  host,
  port,
  spinner: spinnerRef,
}: {
  host: string;
  port: number;
  spinner?: Ora;
}): Promise<Credentials | null> {
  if (spinnerRef) {
    spinnerRef.text = `Connecting to PostgreSQL at ${host}:${port}...`;
  }

  try {
    const client = await connectToMaintenanceDb({ user: "postgres", password: "", host, port });
    return { client, user: "postgres", password: "" };
  } catch (err) {
    const result = classifyPostgresError(err);
    if (result.reason !== "auth") {
      spinnerRef?.stop();
      printPostgresFix(result, { host, port });
      return null;
    }
  }

  spinnerRef?.stop();

  if (!process.stdin.isTTY) {
    printPostgresFix(
      { ok: false, reason: "auth", message: `user "postgres" without a password was rejected` },
      { host, port }
    );
    return null;
  }

  logger.break();
  logger.log(
    `Couldn't connect to PostgreSQL at ${host}:${port} as "postgres" without a password. Enter the credentials Mercur should use to create the project database.`
  );
  logger.break();

  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const attemptSuffix = attempt > 1 ? ` (attempt ${attempt}/${MAX_ATTEMPTS})` : "";

    const answers = await prompts([
      {
        type: "text",
        name: "postgresUsername",
        message: `Enter your Postgres username${attemptSuffix}`,
        initial: "postgres",
      },
      {
        type: "password",
        name: "postgresPassword",
        message: "Enter your Postgres password",
      },
    ]);

    // User cancelled (Ctrl+C) or no TTY
    if (!answers.postgresUsername) {
      printPostgresFix(
        { ok: false, reason: "auth", message: "no credentials entered" },
        { host, port }
      );
      return null;
    }

    const user = answers.postgresUsername as string;
    const password = (answers.postgresPassword as string | undefined) ?? "";

    spinnerRef?.start("Connecting to PostgreSQL...");

    try {
      const client = await connectToMaintenanceDb({ user, password, host, port });
      return { client, user, password };
    } catch (err) {
      spinnerRef?.stop();
      const result = classifyPostgresError(err);
      if (attempt < MAX_ATTEMPTS && result.reason === "auth") {
        logger.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${result.message}`);
        continue;
      }
      printPostgresFix(result, { host, port });
      return null;
    }
  }

  return null;
}

async function pickDatabaseName(
  client: pg.Client,
  initial: string,
  spinnerRef?: Ora
): Promise<string | null> {
  let dbName = initial;

  while (await doesDbExist(client, dbName)) {
    spinnerRef?.stop();
    const { newDbName } = !process.stdin.isTTY ? { newDbName: undefined } : await prompts({
      type: "text",
      name: "newDbName",
      message: `A database named "${dbName}" already exists. Enter a name for the new database:`,
      initial: `${initial}-2`,
      validate: (input: string) => (input && input.trim().length > 0) || "Name is required",
    });

    if (!newDbName) {
      logger.error(
        `Database "${dbName}" already exists. Drop it (dropdb ${dbName}), choose another project name, or pass --db-connection-string to use it as is.`
      );
      return null;
    }

    dbName = (newDbName as string).trim();
    spinnerRef?.start(`Checking database "${dbName}"...`);
  }

  return dbName;
}

async function doesDbExist(
  client: pg.Client,
  dbName: string
): Promise<boolean> {
  const result = await client.query(
    "SELECT 1 FROM pg_catalog.pg_database WHERE datname = $1",
    [dbName]
  );
  return (result.rowCount ?? 0) > 0;
}

function databaseNameOf(connectionString: string): string | null {
  try {
    const name = decodeURIComponent(new URL(connectionString).pathname.slice(1));
    return name || null;
  } catch {
    return null;
  }
}

function formatConnectionString({
  user,
  password,
  host,
  port = DEFAULT_DB_PORT,
  db,
}: {
  user: string;
  password: string;
  host: string;
  port?: number;
  db: string;
}): string {
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${encodeURIComponent(user)}:${encodedPassword}@${host}:${port}/${db}`;
}

async function migrationsTableExists(connectionString: string): Promise<boolean> {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const result = await client.query(
      "SELECT to_regclass('public.mikro_orm_migrations') IS NOT NULL AS exists"
    );
    return Boolean(result.rows[0]?.exists);
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

function lastLines(output: string, count = 20): string {
  return output.trim().split("\n").slice(-count).join("\n");
}

async function runMigrations({
  projectDir,
  spinner: parentSpinner,
  connectionString,
}: DbSetupArgs & { connectionString: string }): Promise<boolean> {
  const apiDir = path.join(projectDir, API_DIR);
  const packageManager = await getPackageManager(apiDir);
  const migrationSpinner = parentSpinner || spinner("Running migrations...").start();

  const buildCmd = packageManager === "yarn"
    ? ["yarn", "run", "build"]
    : packageManager === "pnpm"
      ? ["pnpm", "run", "build"]
      : packageManager === "bun"
        ? ["bun", "run", "build"]
        : ["npm", "run", "build"];

  const runnerCmd = packageManager === "yarn"
    ? ["yarn"]
    : packageManager === "pnpm"
      ? ["pnpm", "exec"]
      : packageManager === "bun"
        ? ["bunx"]
        : ["npx"];

  let output = "";
  try {
    // Build first - compiles TypeScript so ts-node is not needed
    migrationSpinner.text = "Building project...";
    await execa(buildCmd[0], buildCmd.slice(1), { cwd: apiDir });

    migrationSpinner.text = "Running database migrations...";
    const result = await execa(
      runnerCmd[0],
      [...runnerCmd.slice(1), "medusa", "db:migrate"],
      { cwd: apiDir, all: true }
    );
    output = result.all ?? "";
  } catch (err) {
    output =
      (err as { all?: string }).all ?? (err instanceof Error ? err.message : String(err));
  }

  // `db:migrate` can exit 0 without migrating, so confirm against the database.
  if (await migrationsTableExists(connectionString)) {
    if (!parentSpinner) {
      migrationSpinner.succeed("Migrations completed successfully.");
    }
    return true;
  }

  migrationSpinner.fail("Failed to run migrations.");
  if (output) {
    logger.log(lastLines(output));
  }
  const check = await checkPostgres({ connectionString });
  if (!check.ok) {
    printPostgresFix(
      check,
      hostAndPort(connectionString, { host: DEFAULT_DB_HOST, port: DEFAULT_DB_PORT })
    );
  }
  return false;
}

async function createAdminInvite({ projectDir }: { projectDir: string }): Promise<string | null> {
  const apiDir = path.join(projectDir, API_DIR);
  const packageManager = await getPackageManager(apiDir);

  const runnerCmd = packageManager === "yarn"
    ? ["yarn"]
    : packageManager === "pnpm"
      ? ["pnpm", "exec"]
      : packageManager === "bun"
        ? ["bunx"]
        : ["npx"];

  try {
    const result = await execa(runnerCmd[0], [...runnerCmd.slice(1), "medusa", "user", "-e", ADMIN_EMAIL, "--invite"], {
      cwd: apiDir,
    });

    // Parse token from stdout - same approach as Medusa CLI
    const match = result.stdout.match(/Invite token: (?<token>.+)/);
    return match?.groups?.token || null;
  } catch (err) {
    logger.error(
      `Error creating admin invite${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return null;
  }
}

async function seedDatabase({ projectDir, spinner: parentSpinner }: DbSetupArgs): Promise<boolean> {
  const apiDir = path.join(projectDir, API_DIR);
  const packageManager = await getPackageManager(apiDir);
  const seedSpinner = parentSpinner || spinner("Seeding database...").start();

  try {
    const seedCmd = packageManager === "yarn"
      ? ["yarn", "seed"]
      : packageManager === "pnpm"
        ? ["pnpm", "run", "seed"]
        : packageManager === "bun"
          ? ["bun", "run", "seed"]
          : ["npm", "run", "seed"];

    seedSpinner.text = "Seeding database with demo data...";
    await execa(seedCmd[0], seedCmd.slice(1), { cwd: apiDir });

    if (!parentSpinner) {
      seedSpinner.succeed("Database seeded successfully.");
    }
    return true;
  } catch (err) {
    seedSpinner.fail("Failed to seed database.");
    logger.error(
      `Error seeding database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}
