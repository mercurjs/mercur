import pg from "pg";
import { isDockerAvailable } from "./docker-postgres";

export type DbProvider = "docker" | "local" | "connection_string" | "skip";

export interface DbDetectionResult {
  provider: DbProvider;
  connectionString?: string;
  dockerAvailable: boolean;
  localPostgresAvailable: boolean;
  envDatabaseUrl?: string;
}

const DEFAULT_LOCAL_CONNECTION = "postgres://postgres:postgres@localhost:5432/postgres";

/**
 * Detect DATABASE_URL from environment variables
 */
export function detectDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || null;
}

/**
 * Try to connect to local PostgreSQL on default port
 */
export async function detectLocalPostgres(
  connectionString: string = DEFAULT_LOCAL_CONNECTION
): Promise<boolean> {
  try {
    const client = new pg.Client({ connectionString });
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect available database providers and recommend the best option
 */
export async function getDefaultDbProvider(): Promise<DbDetectionResult> {
  // Check for DATABASE_URL in environment
  const envDatabaseUrl = detectDatabaseUrl();

  // Run detection in parallel
  const [dockerAvailable, localPostgresAvailable] = await Promise.all([
    isDockerAvailable(),
    detectLocalPostgres(),
  ]);

  // Determine recommended provider
  let provider: DbProvider;

  if (envDatabaseUrl) {
    provider = "connection_string";
  } else if (localPostgresAvailable) {
    provider = "local";
  } else if (dockerAvailable) {
    provider = "docker";
  } else {
    provider = "skip";
  }

  return {
    provider,
    connectionString: envDatabaseUrl || undefined,
    dockerAvailable,
    localPostgresAvailable,
    envDatabaseUrl: envDatabaseUrl || undefined,
  };
}

export interface DbProviderChoice {
  value: DbProvider;
  label: string;
  description: string;
  disabled?: boolean;
}

/**
 * Get available choices for the database provider prompt
 */
export function getDbProviderChoices(detection: DbDetectionResult): DbProviderChoice[] {
  const choices: DbProviderChoice[] = [];

  // Docker option
  if (detection.dockerAvailable) {
    choices.push({
      value: "docker",
      label: "Docker (recommended)",
      description: "Start PostgreSQL in a Docker container",
    });
  } else {
    choices.push({
      value: "docker",
      label: "Docker (not available)",
      description: "Docker is not running",
      disabled: true,
    });
  }

  // Local Postgres option
  choices.push({
    value: "local",
    label: "I already have PostgreSQL",
    description: detection.localPostgresAvailable
      ? "Local PostgreSQL detected on port 5432"
      : "Enter your connection string",
  });

  // Skip option
  choices.push({
    value: "skip",
    label: "Skip for now",
    description: "Configure database later",
  });

  return choices;
}
