import { randomUUID } from "crypto";
import pg from "pg";

import { logger } from "./logger";

/**
 * Stamps the telemetry installation row so the server's heartbeats report
 * `demo_data: true`. The row is a singleton the server would otherwise create
 * on first boot; the migrations that created the table already ran.
 */
export async function markDemoDataSeeded({
  connectionString,
}: {
  connectionString: string;
}): Promise<boolean> {
  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO telemetry_installation (id, installation_id, milestones, demo_data_seeded_at)
       VALUES ('singleton', $1, '{}', now())
       ON CONFLICT (id) DO UPDATE
         SET demo_data_seeded_at = COALESCE(telemetry_installation.demo_data_seeded_at, now()),
             updated_at = now();`,
      [randomUUID()]
    );
    return true;
  } catch (err) {
    logger.error(
      `Error marking demo data${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}
