export const TELEMETRY_SCHEMA_VERSION = 1
export const TELEMETRY_DOCS_URL = "https://docs.mercurjs.com/telemetry"
export const DEFAULT_TELEMETRY_HOST = "https://telemetry.mercurjs.com"
export const TELEMETRY_REQUEST_TIMEOUT_MS = 2_000
export const HEARTBEAT_INTERVAL_MS = 24 * 60 * 60 * 1_000
export const HEARTBEAT_JITTER_MS = 60 * 60 * 1_000
export const HEARTBEAT_MIN_GAP_SECONDS = 23 * 60 * 60
export const DEFAULT_STARTUP_DELAY_MS = 5_000

const CI_ENV_KEYS = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "CIRCLECI",
  "BUILDKITE",
  "JENKINS_URL",
  "TF_BUILD",
  "TEAMCITY_VERSION",
  "DRONE",
]

const isTruthy = (value: string | undefined) =>
  value !== undefined && ["1", "true", "yes"].includes(value.toLowerCase())

export const isCi = (env: NodeJS.ProcessEnv = process.env) =>
  CI_ENV_KEYS.some((key) => Boolean(env[key]))

export type TelemetryEnablementInput = {
  env?: NodeJS.ProcessEnv
  configEnabled?: boolean
  workerMode?: string
}

export type TelemetryDisabledReason =
  | "env"
  | "do_not_track"
  | "config"
  | "ci"
  | "test"
  | "worker"

export function telemetryDisabledReason({
  env = process.env,
  configEnabled = true,
  workerMode,
}: TelemetryEnablementInput = {}): TelemetryDisabledReason | null {
  if (isTruthy(env.MERCUR_TELEMETRY_FORCE_ENABLED)) {
    return null
  }
  if (isTruthy(env.MERCUR_DISABLE_TELEMETRY)) {
    return "env"
  }
  if (isTruthy(env.DO_NOT_TRACK)) {
    return "do_not_track"
  }
  if (!configEnabled) {
    return "config"
  }
  if (env.NODE_ENV === "test") {
    return "test"
  }
  if (isCi(env)) {
    return "ci"
  }
  if (workerMode === "worker" || env.MEDUSA_WORKER_MODE === "worker") {
    return "worker"
  }
  return null
}

export const isTelemetryDebug = (env: NodeJS.ProcessEnv = process.env) =>
  isTruthy(env.MERCUR_TELEMETRY_DEBUG)

export const telemetryHost = (env: NodeJS.ProcessEnv = process.env) =>
  (env.MERCUR_TELEMETRY_PROXY_URL || DEFAULT_TELEMETRY_HOST).replace(/\/+$/, "")

export const startupDelayMs = (env: NodeJS.ProcessEnv = process.env) => {
  const parsed = Number(env.MERCUR_TELEMETRY_STARTUP_DELAY_MS)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_STARTUP_DELAY_MS
}
