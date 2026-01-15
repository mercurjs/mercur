import { getPackageManager } from "@/src/utils/get-package-manager";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";
import { execa } from "execa";
import path from "path";
import pg from "pg";
import prompts from "prompts";

const DEFAULT_DB_HOST = "localhost";
const DEFAULT_DB_PORT = 5432;

export interface SetupDatabaseResult {
  success: boolean;
  dbName: string;
  connectionString: string | null;
}

export async function setupDatabase(args: {
  projectDir: string;
  projectName: string;
  dbConnectionString?: string;
}): Promise<SetupDatabaseResult> {
  const dbName = args.projectName.replace(/[^a-zA-Z0-9]/g, "-");

  // Try to connect and create database
  const { client, dbConnectionString } = await getDbClient(args);

  if (!client) {
    return { success: false, dbName, connectionString: null };
  }

  try {
    // Check if database already exists
    const exists = await doesDbExist(client, dbName);

    if (exists) {
      logger.warn(`Database "${dbName}" already exists.`);
      await client.end();
      return {
        success: true,
        dbName,
        connectionString: dbConnectionString,
      };
    }

    // Create the database
    await client.query(`CREATE DATABASE "${dbName}"`);
    await client.end();

    // Run migrations
    const migrated = await runMigrations(args);
    if (!migrated) {
      return { success: false, dbName, connectionString: null };
    }

    // Seed database
    const seeded = await seedDatabase(args);
    if (!seeded) {
      return { success: false, dbName, connectionString: null };
    }

    return {
      success: true,
      dbName,
      connectionString: dbConnectionString,
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
}: {
  dbConnectionString?: string;
}): Promise<{
  client: pg.Client | null;
  dbConnectionString: string | null;
}> {
  // If connection string provided, try to use it
  if (dbConnectionString) {
    try {
      return {
        client: new pg.Client({ connectionString: dbConnectionString }),
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

async function runMigrations({
  projectDir,
}: {
  projectDir: string;
}): Promise<boolean> {
  const apiDir = path.join(projectDir, "apps", "api");
  const packageManager = await getPackageManager(apiDir);

  const migrationSpinner = spinner("Running db:migrate command...").start();

  try {
    let migrateCmd: string[];

    if (packageManager === "yarn") {
      migrateCmd = ["yarn", "db:migrate"];
    } else if (packageManager === "pnpm") {
      migrateCmd = ["pnpm", "run", "db:migrate"];
    } else if (packageManager === "bun") {
      migrateCmd = ["bun", "run", "db:migrate"];
    } else {
      migrateCmd = ["npm", "run", "db:migrate"];
    }

    await execa(migrateCmd[0], migrateCmd.slice(1), {
      cwd: apiDir,
    });

    migrationSpinner.succeed("Migrations completed successfully.");
    return true;
  } catch (err) {
    migrationSpinner.fail("Failed to run migrations.");
    logger.error(
      `Error running migrations${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}

async function seedDatabase({
  projectDir,
}: {
  projectDir: string;
}): Promise<boolean> {
  const apiDir = path.join(projectDir, "apps", "api");
  const packageManager = await getPackageManager(apiDir);

  const seedSpinner = spinner("Running db:seed command...").start();

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
