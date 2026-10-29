import { execSync } from "child_process";
import path from "path";

import fs from "fs-extra";

import packageJson from "../../package.json";
import { getPackageManagerFromUserAgent } from "../utils/get-package-manager";
import { highlighter } from "../utils/highlighter";
import { detectSystemInfo } from "./detect-system-info";
import { hashProjectKey } from "./hash";
import { configStore } from "./store";

const DEFAULT_TELEMETRY_HOST = "https://telemetry.mercurjs.com";
const REQUEST_TIMEOUT_MS = 2_000;
const SCHEMA_VERSION = 1;
const PLACEHOLDER_API_KEY = "mercur";

export const TELEMETRY_DOCS_URL = "https://docs.mercurjs.com/telemetry";

const CI_ENV_KEYS = ["CI", "GITHUB_ACTIONS", "GITLAB_CI", "CIRCLECI", "BUILDKITE", "JENKINS_URL", "TF_BUILD", "TEAMCITY_VERSION", "DRONE"];
const AGENT_ENV_KEYS = ["CLAUDECODE", "CLAUDE_CODE", "CURSOR_AGENT", "CODEX_SANDBOX", "GEMINI_CLI", "COPILOT_AGENT", "OPENCODE_CLIENT"];

export const ErrorCategory = {
  NETWORK: "network",
  FS: "fs",
  VALIDATION: "validation",
  REGISTRY: "registry",
  INSTALL: "install",
  DATABASE: "database",
  UNKNOWN: "unknown",
} as const;

export type ErrorCategory = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export interface TelemetryEvent {
  event: string;
  properties?: Record<string, unknown>;
}

const isTruthy = (value: string | undefined) =>
  value !== undefined && ["1", "true", "yes"].includes(value.toLowerCase());

export const isCi = () => CI_ENV_KEYS.some((key) => Boolean(process.env[key]));

export const isTelemetryEnabled = () => {
  if (isTruthy(process.env.MERCUR_TELEMETRY_FORCE_ENABLED)) return true;
  if (isTruthy(process.env.MERCUR_DISABLE_TELEMETRY)) return false;
  if (isTruthy(process.env.DO_NOT_TRACK)) return false;
  if (isCi()) return false;
  return configStore.get("telemetry_enabled");
};

export const showTelemetryNoticeIfNeeded = () => {
  if (configStore.get("notice_shown")) {
    return;
  }

  configStore.set("notice_shown", true);

  if (!isTelemetryEnabled()) {
    return;
  }

  console.error(
    [
      "",
      "Mercur collects anonymous usage data to improve the CLI experience.",
      `You can disable this at any time by running: ${highlighter.info("mercurjs telemetry --disable")}`,
      `Or by setting ${highlighter.info("MERCUR_DISABLE_TELEMETRY=true")}`,
      `Learn more: ${highlighter.info(TELEMETRY_DOCS_URL)}`,
      "",
    ].join("\n")
  );
};

const getGitRemote = (cwd: string) => {
  try {
    return execSync("git config --local --get remote.origin.url", {
      cwd,
      stdio: "pipe",
      timeout: 1000,
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
};

export const getProjectId = (cwd: string): string => hashProjectKey(getGitRemote(cwd) || cwd);

const readJson = async (file: string): Promise<Record<string, unknown> | null> => {
  try {
    return await fs.readJSON(file);
  } catch {
    return null;
  }
};

/**
 * The scaffolded project always has the template layout, so plain reads at
 * known paths are enough to pick up the pinned framework versions.
 */
const readVersions = async (cwd: string) => {
  const [rootPkg, apiPkg] = await Promise.all([
    readJson(path.join(cwd, "package.json")),
    readJson(path.join(cwd, "packages/api/package.json")),
  ]);
  const deps = (pkg: Record<string, unknown> | null) =>
    (pkg?.dependencies ?? {}) as Record<string, string | undefined>;
  const find = (name: string) => deps(rootPkg)[name] ?? deps(apiPkg)[name];

  return {
    mercur_version: find("@mercurjs/core") ?? find("@mercurjs/cli"),
    medusa_version: find("@medusajs/framework"),
  };
};

const baseProperties = async (cwd: string) => {
  const [versions, systemInfo] = await Promise.all([readVersions(cwd), detectSystemInfo()]);
  const projectId = getProjectId(cwd);

  return {
    schema_version: SCHEMA_VERSION,
    source: "create-mercur-app",
    cli_version: packageJson.version,
    ...versions,
    node_version: process.version,
    runtime: process.versions.bun ? "bun" : "node",
    package_manager: getPackageManagerFromUserAgent(),
    os: systemInfo.systemPlatform,
    arch: systemInfo.systemArchitecture,
    is_ci: isCi(),
    is_tty: Boolean(process.stdout.isTTY),
    is_agent: AGENT_ENV_KEYS.some((key) => Boolean(process.env[key])),
    is_docker: systemInfo.isDocker,
    is_wsl: systemInfo.isWSL,
    cloud_provider: systemInfo.deploymentVendor,
    project_id: projectId,
    $groups: { project: projectId },
    $geoip_disable: true,
  };
};

export const sendTelemetryEvent = async (event: TelemetryEvent, options: { cwd: string }) => {
  try {
    if (!isTelemetryEnabled()) {
      return;
    }

    const body = {
      api_key: PLACEHOLDER_API_KEY,
      batch: [
        {
          event: event.event,
          distinct_id: configStore.deviceId(),
          timestamp: new Date().toISOString(),
          properties: { ...(await baseProperties(options.cwd)), ...event.properties },
        },
      ],
    };

    if (isTruthy(process.env.MERCUR_TELEMETRY_DEBUG)) {
      console.error(`[telemetry] ${JSON.stringify(body.batch, null, 2)}`);
      return;
    }

    const host = (process.env.MERCUR_TELEMETRY_PROXY_URL || DEFAULT_TELEMETRY_HOST).replace(/\/+$/, "");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      await fetch(`${host}/batch`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Telemetry must never fail a command.
  }
};

export const categorizeError = (error: unknown): ErrorCategory => {
  if (error && typeof error === "object") {
    const name = (error as { name?: string }).name ?? "";
    const code = (error as { code?: string }).code ?? "";
    const message = (error as { message?: string }).message ?? "";
    if ((Object.values(ErrorCategory) as string[]).includes(name)) return name as ErrorCategory;
    if (name === "ZodError") return ErrorCategory.VALIDATION;
    if (["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(code) || /fetch failed/i.test(message)) {
      return ErrorCategory.NETWORK;
    }
    if (["ENOENT", "EACCES", "EPERM", "EEXIST", "ENOTDIR", "EISDIR"].includes(code)) return ErrorCategory.FS;
  }
  return ErrorCategory.UNKNOWN;
};
