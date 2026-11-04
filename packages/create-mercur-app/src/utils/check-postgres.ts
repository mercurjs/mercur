import pg from "pg";

import { highlighter } from "./highlighter";
import { logger } from "./logger";

export type PostgresCheckResult =
  | { ok: true }
  | { ok: false; reason: "unreachable" | "auth" | "missing-database" | "unknown"; message: string };

const UNREACHABLE_CODES = ["ECONNREFUSED", "ENOTFOUND", "EHOSTUNREACH", "ETIMEDOUT", "EAI_AGAIN"];

export function classifyPostgresError(error: unknown): PostgresCheckResult {
  const code = (error as { code?: string } | null)?.code ?? "";
  // Node raises an AggregateError with an empty message when both the IPv4 and
  // IPv6 attempts are refused.
  const nested = error instanceof AggregateError ? error.errors[0] : undefined;
  const message =
    (error instanceof Error && error.message) ||
    (nested instanceof Error && nested.message) ||
    code ||
    String(error);

  if (UNREACHABLE_CODES.includes(code) || /timeout|ECONNREFUSED/i.test(message)) {
    return { ok: false, reason: "unreachable", message };
  }
  // 28P01 invalid_password, 28000 invalid_authorization_specification
  if (code === "28P01" || code === "28000") {
    return { ok: false, reason: "auth", message };
  }
  if (code === "3D000") {
    return { ok: false, reason: "missing-database", message };
  }
  return { ok: false, reason: "unknown", message };
}

export async function checkPostgres(
  target: { connectionString: string } | { host: string; port: number }
): Promise<PostgresCheckResult> {
  const client = new pg.Client(
    "connectionString" in target
      ? { connectionString: target.connectionString, connectionTimeoutMillis: 5000 }
      : {
          host: target.host,
          port: target.port,
          user: "postgres",
          password: "",
          database: "postgres",
          connectionTimeoutMillis: 5000,
        }
  );

  try {
    await client.connect();
    await client.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    return classifyPostgresError(error);
  } finally {
    await client.end().catch(() => {});
  }
}

export function hostAndPort(
  connectionString: string,
  fallback: { host: string; port: number }
): { host: string; port: number } {
  try {
    const url = new URL(connectionString);
    return { host: url.hostname || fallback.host, port: Number(url.port) || fallback.port };
  } catch {
    return fallback;
  }
}

function startCommands(port: number): string[] {
  const docker = `docker run -d --name mercur-postgres -p ${port}:5432 -e POSTGRES_PASSWORD=postgres postgres:17`;

  if (process.platform === "darwin") {
    return [
      `brew install postgresql@17 && brew services start postgresql@17`,
      `or: ${docker}`,
    ];
  }
  if (process.platform === "linux") {
    return [`sudo systemctl start postgresql`, `or: ${docker}`];
  }
  return [docker, `or start the "postgresql" service from services.msc`];
}

export function printPostgresFix(
  result: Exclude<PostgresCheckResult, { ok: true }>,
  { host, port }: { host: string; port: number }
): void {
  const target = `${host}:${port}`;
  const lines: string[] = [];

  switch (result.reason) {
    case "unreachable":
      lines.push(`PostgreSQL is not reachable at ${target} (${result.message}).`);
      lines.push("Start it, then run this command again:");
      lines.push(...startCommands(port).map((cmd) => `  ${highlighter.info(cmd)}`));
      break;
    case "auth":
      lines.push(`PostgreSQL at ${target} rejected the credentials (${result.message}).`);
      lines.push("Pass a working user and password, for example:");
      lines.push(
        `  ${highlighter.info(`--db-connection-string postgresql://<user>:<password>@${host}:${port}/postgres`)}`
      );
      break;
    case "missing-database":
      lines.push(`The database does not exist on ${target} (${result.message}).`);
      lines.push("Create it first, or point the connection string at an existing database:");
      lines.push(`  ${highlighter.info(`createdb -h ${host} -p ${port} <database>`)}`);
      break;
    default:
      lines.push(`Could not connect to PostgreSQL at ${target}: ${result.message}`);
      lines.push(`Check that it is running: ${highlighter.info(`pg_isready -h ${host} -p ${port}`)}`);
  }

  lines.push(`To scaffold without a database, pass ${highlighter.info("--skip-db")}.`);

  logger.break();
  for (const line of lines) {
    logger.log(line);
  }
  logger.break();
}
