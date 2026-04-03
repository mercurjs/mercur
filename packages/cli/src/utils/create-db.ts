import { getPackageManager } from "@/src/utils/get-package-manager";
import { logger } from "@/src/utils/logger";
import { manageEnvFiles } from "@/src/utils/manage-env-files";
import { spinner } from "@/src/utils/spinner";
import { execa } from "execa";
import type { Ora } from "ora";
import path from "path";
import pg from "pg";
import prompts from "prompts";

const dbHost = "localhost";
const dbPort = 5432;
const API_DIR = "packages/api";
const ADMIN_EMAIL = "admin@mercur-test.com";

interface DbSetupArgs {
  projectDir: string;
  spinner?: Ora;
}

export interface SetupDatabaseResult {
  success: boolean;
  dbName: string;
  connectionString: string | null;
  alreadyExists?: boolean;
  inviteToken?: string | null;
}

export async function setupDatabase(args: {
  projectDir: string;
  projectName: string;
  dbConnectionString?: string;
  dbHost?: string;
  dbPort?: number;
  spinner?: Ora;
}): Promise<SetupDatabaseResult> {
  const dbName = args.projectName.replace(/[^a-zA-Z0-9]/g, "-");

  const { client, dbConnectionString } = await getDbClient({
    dbConnectionString: args.dbConnectionString,
    dbHost: args.dbHost ?? dbHost,
    dbPort: args.dbPort ?? dbPort,
    dbName,
    spinner: args.spinner,
  });

  if (!client || !dbConnectionString) {
    return { success: false, dbName, connectionString: null };
  }

  try {
    if (args.spinner) {
      args.spinner.text = "Checking if database exists...";
    }
    const exists = await doesDbExist(client, dbName);

    if (exists) {
      await client.end();
      return runPostDbSetup({
        ...args,
        dbName,
        connectionString: dbConnectionString,
        alreadyExists: true,
      });
    }

    if (args.spinner) {
      args.spinner.text = `Creating database "${dbName}"...`;
    }
    await client.query(`CREATE DATABASE "${dbName}"`);
    await client.end();

    return runPostDbSetup({
      ...args,
      dbName,
      connectionString: dbConnectionString,
      alreadyExists: false,
    });
  } catch (err) {
    logger.error(
      `Error creating database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    await client.end().catch(() => {});
    return { success: false, dbName, connectionString: null };
  }
}

async function runPostDbSetup(args: DbSetupArgs & {
  dbName: string;
  connectionString: string;
  alreadyExists: boolean;
}): Promise<SetupDatabaseResult> {
  const { projectDir, spinner, dbName, connectionString, alreadyExists } = args;

  // Medusa needs DATABASE_URL in .env before running migrations
  await manageEnvFiles({
    projectDir,
    databaseUri: connectionString,
  });

  const migrated = await runMigrations({ projectDir, spinner });
  if (!migrated) {
    return { success: false, dbName, connectionString: null };
  }

  const seeded = await seedDatabase({ projectDir, spinner });
  if (!seeded) {
    return { success: false, dbName, connectionString: null };
  }

  const inviteToken = await createAdminInvite({ projectDir });

  return {
    success: true,
    dbName,
    connectionString,
    alreadyExists,
    inviteToken,
  };
}

interface DbClientResult {
  client: pg.Client | null;
  dbConnectionString: string | null;
}

async function getDbClient({
  dbConnectionString,
  dbHost,
  dbPort,
  dbName,
  spinner: spinnerRef,
}: {
  dbConnectionString?: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  spinner?: Ora;
}): Promise<DbClientResult> {
  if (dbConnectionString) {
    try {
      const client = new pg.Client({ connectionString: dbConnectionString });
      await client.connect();
      return { client, dbConnectionString };
    } catch (error) {
      logger.error(
        `Invalid database connection string${error instanceof Error ? `: ${error.message}` : ""}.`
      );
      return { client: null, dbConnectionString: null };
    }
  }

  // Step 1: silent default attempt (postgres / no password)
  if (spinnerRef) {
    spinnerRef.text = `Trying default connection (postgres@${dbHost}:${dbPort})...`;
  }

  try {
    const client = new pg.Client({
      user: "postgres",
      password: "",
      host: dbHost,
      port: dbPort,
      database: "postgres",
      connectionTimeoutMillis: 5000,
    });
    await client.connect();
    return {
      client,
      dbConnectionString: formatConnectionString({
        user: "postgres",
        password: "",
        host: dbHost,
        port: dbPort,
        db: dbName,
      }),
    };
  } catch {
    // Default connection failed — ask the user for credentials
  }

  spinnerRef?.stop();

  logger.break();
  logger.log(`PostgreSQL is required. Make sure it is installed and running on ${dbHost}:${dbPort}.`);
  logger.break();

  // Step 2: prompt with up to 3 retry attempts
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
        message: 'Enter your Postgres password (press Enter for "postgres")',
      },
    ]);

    // User cancelled (Ctrl+C)
    if (!answers.postgresUsername) {
      return { client: null, dbConnectionString: null };
    }

    const username = answers.postgresUsername as string;
    const password = (answers.postgresPassword as string) || "postgres";

    spinnerRef?.start("Connecting to database...");

    try {
      const client = new pg.Client({
        user: username,
        password,
        host: dbHost,
        port: dbPort,
        database: "postgres",
        connectionTimeoutMillis: 5000,
      });
      await client.connect();
      return {
        client,
        dbConnectionString: formatConnectionString({
          user: username,
          password,
          host: dbHost,
          port: dbPort,
          db: dbName,
        }),
      };
    } catch (err) {
      spinnerRef?.stop();
      const message = err instanceof Error ? err.message : String(err);

      if (attempt < MAX_ATTEMPTS) {
        logger.warn(`Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`);
      } else {
        logger.error(
          `Couldn't connect to PostgreSQL: ${message}\n` +
          `  → Is PostgreSQL running? Try: pg_isready -h ${dbHost} -p ${dbPort}\n` +
          `  → Check your username, password, and that the server is accessible.`
        );
      }
    }
  }

  return { client: null, dbConnectionString: null };
}

async function doesDbExist(
  client: pg.Client,
  dbName: string
): Promise<boolean> {
  const result = await client.query(
    `SELECT datname FROM pg_catalog.pg_database WHERE datname='${dbName}';`
  );
  return (result.rowCount ?? 0) > 0;
}

function formatConnectionString({
  user,
  password,
  host,
  port = dbPort,
  db,
}: {
  user: string;
  password: string;
  host: string;
  port?: number;
  db: string;
}): string {
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${db}`;
}

async function runMigrations({ projectDir, spinner: parentSpinner }: DbSetupArgs): Promise<boolean> {
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

  const runnerCmd = packageManager === "pnpm"
    ? ["pnpm", "dlx"]
    : packageManager === "bun"
      ? ["bunx"]
      : ["npx"];

  try {
    // Build first - compiles TypeScript so ts-node is not needed
    migrationSpinner.text = "Building project...";
    await execa(buildCmd[0], buildCmd.slice(1), { cwd: apiDir });

    migrationSpinner.text = "Running database migrations...";
    await execa(runnerCmd[0], [...runnerCmd.slice(1), "medusa", "db:migrate"], { cwd: apiDir });

    if (!parentSpinner) {
      migrationSpinner.succeed("Migrations completed successfully.");
    }
    return true;
  } catch (err) {
    migrationSpinner.fail("Failed to run migrations.");
    logger.error(
      `Error running migrations${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}

async function createAdminInvite({ projectDir }: { projectDir: string }): Promise<string | null> {
  const apiDir = path.join(projectDir, API_DIR);
  const packageManager = await getPackageManager(apiDir);

  const runnerCmd = packageManager === "pnpm"
    ? ["pnpm", "dlx"]
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
