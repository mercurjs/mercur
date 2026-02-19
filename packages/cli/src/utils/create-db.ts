import { getPackageManager } from "@/src/utils/get-package-manager";
import { logger } from "@/src/utils/logger";
import { manageEnvFiles } from "@/src/utils/manage-env-files";
import { spinner } from "@/src/utils/spinner";
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
  spinner?: Ora;
}): Promise<SetupDatabaseResult> {
  const dbName = args.projectName.replace(/[^a-zA-Z0-9]/g, "-");

  const { client, dbConnectionString } = await getDbClient({
    dbConnectionString: args.dbConnectionString,
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

  const seeded = await seedDatabase({ projectDir });
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
  spinner: spinnerRef,
}: {
  dbConnectionString?: string;
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

  let postgresUsername = "postgres";
  let postgresPassword = "";

  try {
    const defaultCredentials = {
      user: postgresUsername,
      password: postgresPassword,
      host: DEFAULT_DB_HOST,
      port: DEFAULT_DB_PORT,
      db: "postgres",
    };

    const client = new pg.Client(defaultCredentials);
    await client.connect();
    return {
      client,
      dbConnectionString: formatConnectionString(defaultCredentials),
    };
  } catch {
    spinnerRef?.stop();

    const answers = await prompts([
      {
        type: "text",
        name: "postgresUsername",
        message: "Enter your Postgres username",
        initial: "postgres",
      },
      {
        type: "password",
        name: "postgresPassword",
        message: "Enter your Postgres password",
      },
    ]);

    if (!answers.postgresUsername) {
      return { client: null, dbConnectionString: null };
    }

    postgresUsername = answers.postgresUsername;
    postgresPassword = answers.postgresPassword || "";

    spinnerRef?.start("Connecting to database...");

    try {
      const client = new pg.Client({
        user: postgresUsername,
        password: postgresPassword,
        host: DEFAULT_DB_HOST,
        port: DEFAULT_DB_PORT,
        database: postgresUsername,
      });
      await client.connect();
      return {
        client,
        dbConnectionString: formatConnectionString({
          user: postgresUsername,
          password: postgresPassword,
          host: DEFAULT_DB_HOST,
          port: DEFAULT_DB_PORT,
          db: postgresUsername,
        }),
      };
    } catch (err) {
      logger.error(
        `Couldn't connect to PostgreSQL${err instanceof Error ? `: ${err.message}` : ""}.`
      );
      return { client: null, dbConnectionString: null };
    }
  }
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

async function seedDatabase({ projectDir }: { projectDir: string }): Promise<boolean> {
  const apiDir = path.join(projectDir, API_DIR);
  const packageManager = await getPackageManager(apiDir);
  const seedSpinner = spinner("Seeding database...").start();

  try {
    const seedCmd = packageManager === "yarn"
      ? ["yarn", "seed"]
      : packageManager === "pnpm"
        ? ["pnpm", "run", "seed"]
        : packageManager === "bun"
          ? ["bun", "run", "seed"]
          : ["npm", "run", "seed"];

    await execa(seedCmd[0], seedCmd.slice(1), { cwd: apiDir });

    seedSpinner.succeed("Database seeded successfully.");
    return true;
  } catch (err) {
    seedSpinner.fail("Failed to seed database.");
    logger.error(
      `Error seeding database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}
