import { createHash } from "crypto";

const PROJECT_ID_SALT = "mercur-telemetry-v1";

/**
 * Same salt and encoding as `@mercurjs/core`, so a scaffolded project and the
 * server later built from it share one `project_id`.
 */
export const hashProjectKey = (input: string): string =>
  createHash("sha256").update(`${PROJECT_ID_SALT}:${input}`).digest("base64url");
