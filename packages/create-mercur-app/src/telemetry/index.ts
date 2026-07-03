import { execSync } from "child_process";
import path from "path";

import fs from "fs-extra";

import { highlighter } from "../utils/highlighter";
import { getPackageManager } from "../utils/get-package-manager";
import { detectSystemInfo } from "./detect-system-info";
import { hashToBase64 } from "./hash";
import { configStore } from "./store";

const TELEMETRY_URL =
  process.env.MERCUR_TELEMETRY_PROXY_URL ||
  "https://telemetry.mercurjs.com/api/v1/events";

export interface TelemetryEvent {
  type: string;
  payload?: Record<string, unknown>;
}

export const setTelemetryEmail = (email: string) => {
  configStore.set("telemetry_email", email);
};

export const TELEMETRY_DOCS_URL = "https://docs.mercurjs.com/telemetry";

export const showTelemetryNoticeIfNeeded = () => {
  if (configStore.get("notice_shown")) {
    return;
  }

  configStore.set("notice_shown", true);

  if (process.env.MERCUR_DISABLE_TELEMETRY === "true") {
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

const isTelemetryEnabled = () => {
  return (
    configStore.get("telemetry_enabled") &&
    process.env.MERCUR_DISABLE_TELEMETRY !== "true"
  );
};

export const sendTelemetryEvent = async (
  event: TelemetryEvent,
  options: { cwd: string }
) => {
  try {
    if (!isTelemetryEnabled()) {
      return;
    }

    const projectInfo = await getProjectInfo(options.cwd);

    const baseEvent = {
      nodeEnv: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      mercurVersion: projectInfo.mercurVersion,
      medusaVersion: projectInfo.medusaVersion,
      isSrcDir: projectInfo.isSrcDir,
      aliasPrefix: projectInfo.aliasPrefix,
      config: projectInfo.config,
      projectId: getProjectId(options.cwd),
      systemInfo: await detectSystemInfo(),
      packageManager: await getPackageManager(options.cwd),
      email: getTelemetryEmail(),
    };

    await fetch(TELEMETRY_URL, {
      body: JSON.stringify({ ...baseEvent, ...event }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "post",
    });
  } catch {
    // Eat any errors in sending telemetry event
  }
};

const getGitID = () => {
  try {
    const originBuffer = execSync(
      "git config --local --get remote.origin.url",
      {
        stdio: "pipe",
        timeout: 1000,
      }
    );

    return String(originBuffer).trim();
  } catch {
    return null;
  }
};

const getProjectId = (cwd: string): string => {
  const gitID = getGitID();
  if (gitID) {
    return hashToBase64(gitID);
  }

  return hashToBase64(cwd);
};

export const getTelemetryEmail = () => {
  return configStore.get("telemetry_email") || undefined;
};

interface ProjectInfo {
  isSrcDir: boolean;
  aliasPrefix: string | null;
  medusaVersion: string | null;
  config: unknown;
  mercurVersion: string | null;
}

/**
 * Lightweight project introspection for freshly scaffolded projects. The full
 * CLI resolves this via tsconfig-paths/fast-glob/cosmiconfig; here the project
 * always has the template layout, so plain file reads at known paths suffice
 * and keep this package's dependency tree minimal.
 */
async function getProjectInfo(cwd: string): Promise<ProjectInfo> {
  const readJson = async (relPath: string): Promise<Record<string, unknown> | null> => {
    try {
      return await fs.readJSON(path.join(cwd, relPath));
    } catch {
      return null;
    }
  };

  const [isSrcDir, rootPkg, apiPkg, config, tsconfig] = await Promise.all([
    fs.pathExists(path.join(cwd, "src")),
    readJson("package.json"),
    readJson("packages/api/package.json"),
    readJson("blocks.json"),
    readJson("tsconfig.json"),
  ]);

  const dependenciesOf = (pkg: Record<string, unknown> | null) =>
    (pkg?.dependencies ?? {}) as Record<string, string | undefined>;

  const findDep = (name: string): string | null =>
    dependenciesOf(rootPkg)[name] ?? dependenciesOf(apiPkg)[name] ?? null;

  const compilerOptions = (tsconfig?.compilerOptions ?? {}) as {
    paths?: Record<string, unknown>;
  };
  const paths = compilerOptions.paths ?? {};
  const firstPath = Object.keys(paths)[0];
  const aliasPrefix = firstPath
    ? firstPath.includes("*")
      ? firstPath.replace("/*", "")
      : firstPath.replace("/", "")
    : null;

  return {
    isSrcDir,
    aliasPrefix,
    medusaVersion: findDep("@medusajs/framework"),
    mercurVersion: findDep("@mercurjs/cli"),
    config,
  };
}
