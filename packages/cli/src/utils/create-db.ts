import { logger } from "@/src/utils/logger";
import pg from "pg";
import prompts from "prompts";

const DEFAULT_DB_HOST = "localhost";
const DEFAULT_DB_PORT = 5432;

export interface SetupDatabaseResult {
  success: boolean;
  dbName: string;
  connectionString?: string;
}

export async function setupDatabase({
  projectName,
  dbConnectionString,
}: {
  projectName: string;
  dbConnectionString?: string;
}): Promise<SetupDatabaseResult> {
  const dbName = `mercur-${projectName.replace(/[^a-zA-Z0-9]/g, "-")}`;

  // If connection string provided, just return it (database should already exist)
  if (dbConnectionString) {
    return {
      success: true,
      dbName,
      connectionString: dbConnectionString,
    };
  }

  // Try to connect and create database
  const { client, credentials } = await getDbClient();

  if (!client) {
    return { success: false, dbName };
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
        connectionString: formatConnectionString({ ...credentials, db: dbName }),
      };
    }

    // Create the database
    await client.query(`CREATE DATABASE "${dbName}"`);
    await client.end();

    return {
      success: true,
      dbName,
      connectionString: formatConnectionString({ ...credentials, db: dbName }),
    };
  } catch (err) {
    logger.error(
      `Error creating database${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    await client.end().catch(() => {});
    return { success: false, dbName };
  }
}

async function getDbClient(): Promise<{
  client: pg.Client | null;
  credentials: { user: string; password: string; host: string; port: number };
}> {
  let postgresUsername = "postgres";
  let postgresPassword = "";

  const credentials = {
    user: postgresUsername,
    password: postgresPassword,
    host: DEFAULT_DB_HOST,
    port: DEFAULT_DB_PORT,
  };

  // Try default connection first
  try {
    const client = new pg.Client({
      user: postgresUsername,
      password: postgresPassword,
      host: DEFAULT_DB_HOST,
      port: DEFAULT_DB_PORT,
      database: "postgres",
    });
    await client.connect();
    return { client, credentials };
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
      return { client: null, credentials };
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
        credentials: {
          ...credentials,
          user: postgresUsername,
          password: postgresPassword,
        },
      };
    } catch (err) {
      logger.error(
        `Couldn't connect to PostgreSQL${err instanceof Error ? `: ${err.message}` : ""}.`
      );
      return { client: null, credentials };
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
