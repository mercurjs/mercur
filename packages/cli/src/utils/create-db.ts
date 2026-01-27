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

const ADMIN_EMAIL = "admin@mercur-test.com";

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

  // Try to connect and create database
  const { client, dbConnectionString } = await getDbClient({
    dbConnectionString: args.dbConnectionString,
    spinner: args.spinner,
  });

  if (!client || !dbConnectionString) {
    return { success: false, dbName, connectionString: null };
  }

  try {
    // Check if database already exists
    if (args.spinner) {
      args.spinner.text = "Checking if database exists...";
    }
    const exists = await doesDbExist(client, dbName);

    // Build the final connection string pointing to the new database
    const finalConnectionString = replaceDbInConnectionString(dbConnectionString, dbName);

    if (exists) {
      await client.end();

      // Save connection string to .env BEFORE running migrations (Medusa needs it)
      await manageEnvFiles({
        projectDir: args.projectDir,
        databaseUri: finalConnectionString,
      });

      // Run migrations on existing database
      const migrated = await runMigrations({ ...args, spinner: args.spinner });
      if (!migrated) {
        return { success: false, dbName, connectionString: null };
      }

      // Seed database
      const seeded = await seedDatabase({ ...args, spinner: args.spinner });
      if (!seeded) {
        return { success: false, dbName, connectionString: null };
      }

      // Create admin invite
      const inviteToken = await createAdminInvite({ ...args, spinner: args.spinner });

      return {
        success: true,
        dbName,
        connectionString: finalConnectionString,
        alreadyExists: true,
        inviteToken,
      };
    }

    // Create the database
    if (args.spinner) {
      args.spinner.text = `Creating database "${dbName}"...`;
    }
    await client.query(`CREATE DATABASE "${dbName}"`);
    await client.end();

    // Save connection string to .env BEFORE running migrations (Medusa needs it)
    await manageEnvFiles({
      projectDir: args.projectDir,
      databaseUri: finalConnectionString,
    });

    // Run migrations
    const migrated = await runMigrations({ ...args, spinner: args.spinner });
    if (!migrated) {
      return { success: false, dbName, connectionString: null };
    }

    // Seed database
    const seeded = await seedDatabase({ ...args, spinner: args.spinner });
    if (!seeded) {
      return { success: false, dbName, connectionString: null };
    }

    // Create admin invite
    const inviteToken = await createAdminInvite({ ...args, spinner: args.spinner });

    return {
      success: true,
      dbName,
      connectionString: finalConnectionString,
      inviteToken,
    };
  } catch (err) {
    logger.error(
      `Error creating database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    await client.end().catch(() => {});
    return { success: false, dbName, connectionString: null };
  }
}

async function getDbClient({
  dbConnectionString,
  spinner: spinnerRef,
}: {
  dbConnectionString?: string;
  spinner?: Ora;
}): Promise<{
  client: pg.Client | null;
  dbConnectionString: string | null;
}> {
  // If connection string provided, try to use it
  if (dbConnectionString) {
    if (spinnerRef) {
      spinnerRef.text = "Connecting to PostgreSQL...";
    }
    try {
      const client = new pg.Client({ connectionString: dbConnectionString });
      await client.connect();
      return {
        client,
        dbConnectionString,
      };
    } catch (error) {
      logger.error(
        `Invalid database connection string${error instanceof Error ? `: ${error.message}` : ""}.`
      );
      return { client: null, dbConnectionString: null };
    }
  }

  let postgresUsername = "postgres";
  let postgresPassword = "";

  // If no connection string provided, try default connection
  if (spinnerRef) {
    spinnerRef.text = "Trying default PostgreSQL connection...";
  }
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
    // Stop spinner before prompts
    spinnerRef?.stop();

    // Ask for credentials
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

    // Restart spinner after prompts
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

/**
 * Replace the database name in a connection string
 */
function replaceDbInConnectionString(connectionString: string, newDbName: string): string {
  try {
    const url = new URL(connectionString);
    url.pathname = `/${newDbName}`;
    return url.toString();
  } catch {
    // Fallback: simple regex replacement for the database part
    return connectionString.replace(/\/[^/?]+(\?|$)/, `/${newDbName}$1`);
  }
}

async function runMigrations({
  projectDir,
  spinner: parentSpinner,
}: {
  projectDir: string;
  spinner?: Ora;
}): Promise<boolean> {
  const apiDir = path.join(projectDir, "packages", "api");

  const migrationSpinner = parentSpinner || spinner("Running migrations...").start();
  migrationSpinner.text = "Running database migrations...";

  try {
    // Build first (compiles TypeScript so ts-node is not needed)
    migrationSpinner.text = "Building project...";
    await execa("npm", ["run", "build"], {
      cwd: apiDir,
    });

    // Run migrations
    migrationSpinner.text = "Running database migrations...";
    await execa("npx", ["medusa", "db:migrate"], {
      cwd: apiDir,
    });

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

async function createAdminInvite({
  projectDir,
  spinner: parentSpinner,
}: {
  projectDir: string;
  spinner?: Ora;
}): Promise<string | null> {
  const apiDir = path.join(projectDir, "packages", "api");

  if (parentSpinner) {
    parentSpinner.text = "Creating admin invite...";
  }

  try {
    const result = await execa("npx", ["medusa", "user", "-e", ADMIN_EMAIL, "--invite"], {
      cwd: apiDir,
    });

    // Parse token from stdout (same as Medusa CLI does)
    const match = result.stdout.match(/Invite token: (?<token>.+)/);
    return match?.groups?.token || null;
  } catch (err) {
    logger.error(
      `Error creating admin invite${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return null;
  }
}

async function seedDatabase({
  projectDir,
  spinner: parentSpinner,
}: {
  projectDir: string;
  spinner?: Ora;
}): Promise<boolean> {
  const apiDir = path.join(projectDir, "packages", "api");
  const packageManager = await getPackageManager(apiDir);

  const seedSpinner = parentSpinner || spinner("Seeding database...").start();
  seedSpinner.text = "Seeding database...";

  try {
    let seedCmd: string[];

    if (packageManager === "yarn") {
      seedCmd = ["yarn", "seed"];
    } else if (packageManager === "pnpm") {
      seedCmd = ["pnpm", "run", "seed"];
    } else if (packageManager === "bun") {
      seedCmd = ["bun", "run", "seed"];
    } else {
      seedCmd = ["npm", "run", "seed"];
    }

    await execa(seedCmd[0], seedCmd.slice(1), {
      cwd: apiDir,
    });

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
