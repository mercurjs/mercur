import { execa } from "execa";
import fs from "fs-extra";
import net from "net";
import path from "path";
import pg from "pg";

const DEFAULT_POSTGRES_PORT = 5432;
const MAX_PORT_ATTEMPTS = 10;
const HEALTHCHECK_TIMEOUT_MS = 60000;
const HEALTHCHECK_INTERVAL_MS = 1000;

export interface DockerPostgresConfig {
  projectName: string;
  projectDir: string;
  port?: number;
  password?: string;
  onProgress?: (message: string) => void;
}

export interface DockerPostgresResult {
  success: boolean;
  connectionString?: string;
  port?: number;
  error?: string;
}

/**
 * Check if Docker is available and running
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await execa("docker", ["info"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close();
      resolve(true);
    });

    server.listen(port, "127.0.0.1");
  });
}

/**
 * Find an available port starting from the default PostgreSQL port
 */
export async function findAvailablePort(
  startPort: number = DEFAULT_POSTGRES_PORT
): Promise<number | null> {
  for (let i = 0; i < MAX_PORT_ATTEMPTS; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Check if a container with the given name already exists
 */
async function containerExists(containerName: string): Promise<boolean> {
  try {
    const result = await execa(
      "docker",
      ["ps", "-a", "--filter", `name=^${containerName}$`, "--format", "{{.Names}}"],
      { stdio: "pipe" }
    );
    return result.stdout.trim() === containerName;
  } catch {
    return false;
  }
}

/**
 * Check if a container is running
 */
async function isContainerRunning(containerName: string): Promise<boolean> {
  try {
    const result = await execa(
      "docker",
      ["ps", "--filter", `name=^${containerName}$`, "--format", "{{.Names}}"],
      { stdio: "pipe" }
    );
    return result.stdout.trim() === containerName;
  } catch {
    return false;
  }
}

/**
 * Get the port mapping for a running container
 */
async function getContainerPort(containerName: string): Promise<number | null> {
  try {
    const result = await execa(
      "docker",
      ["port", containerName, "5432"],
      { stdio: "pipe" }
    );
    // Output is like "0.0.0.0:5432" or "127.0.0.1:5432"
    const match = result.stdout.match(/:(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  } catch {
    return null;
  }
}

/**
 * Generate docker-compose.yml content
 */
export function generateDockerCompose(config: {
  projectName: string;
  port: number;
  password: string;
}): string {
  const sanitizedName = config.projectName.replace(/[^a-zA-Z0-9-]/g, "-");

  return `services:
  postgres:
    image: postgres:latest
    container_name: ${sanitizedName}-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${config.password}
      POSTGRES_DB: ${sanitizedName}
    ports:
      - "${config.port}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 2s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
`;
}

/**
 * Wait for PostgreSQL to be ready to accept connections
 */
export async function waitForPostgres(
  connectionString: string,
  timeoutMs: number = HEALTHCHECK_TIMEOUT_MS
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const client = new pg.Client({ connectionString });
      await client.connect();
      await client.end();
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, HEALTHCHECK_INTERVAL_MS));
    }
  }

  return false;
}

/**
 * Start PostgreSQL container using docker-compose
 */
export async function startPostgresContainer(
  config: DockerPostgresConfig
): Promise<DockerPostgresResult> {
  const sanitizedName = config.projectName.replace(/[^a-zA-Z0-9-]/g, "-");
  const containerName = `${sanitizedName}-postgres`;
  const password = config.password || "postgres";
  const progress = config.onProgress || (() => {});

  // Check if container already exists and is running
  progress("Checking for existing container...");
  if (await isContainerRunning(containerName)) {
    const existingPort = await getContainerPort(containerName);
    if (existingPort) {
      const connectionString = `postgres://postgres:${password}@localhost:${existingPort}/${sanitizedName}`;

      progress("Found existing container, verifying connection...");
      const isReady = await waitForPostgres(connectionString, 5000);
      if (isReady) {
        return {
          success: true,
          connectionString,
          port: existingPort,
        };
      }
    }
  }

  // If container exists but not running, remove it
  if (await containerExists(containerName)) {
    progress("Removing stopped container...");
    try {
      await execa("docker", ["rm", "-f", containerName], { stdio: "pipe" });
    } catch {
      // Ignore errors
    }
  }

  // Find available port
  progress("Finding available port...");
  const port = config.port || (await findAvailablePort());
  if (!port) {
    return {
      success: false,
      error: "Could not find an available port for PostgreSQL",
    };
  }

  // Generate docker-compose.yml
  progress("Generating docker-compose.yml...");
  const composeContent = generateDockerCompose({
    projectName: config.projectName,
    port,
    password,
  });

  const composeFilePath = path.join(config.projectDir, "docker-compose.yml");

  try {
    // Write docker-compose.yml
    await fs.writeFile(composeFilePath, composeContent);

    // Start container
    progress("Starting PostgreSQL container...");
    await execa("docker", ["compose", "up", "-d"], {
      cwd: config.projectDir,
      stdio: "pipe",
    });

    const connectionString = `postgres://postgres:${password}@localhost:${port}/${sanitizedName}`;

    // Wait for PostgreSQL to be ready
    progress("Waiting for PostgreSQL to be ready...");
    const isReady = await waitForPostgres(connectionString);
    if (!isReady) {
      return {
        success: false,
        error: "PostgreSQL container started but database is not responding",
      };
    }

    return {
      success: true,
      connectionString,
      port,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to start PostgreSQL container: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Stop and remove PostgreSQL container
 */
export async function stopPostgresContainer(
  projectDir: string
): Promise<boolean> {
  try {
    await execa("docker", ["compose", "down"], {
      cwd: projectDir,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}
