import type { Command } from "commander";
import { categorizeError, sendTelemetryEvent } from "./index";

/**
 * Flag values are only kept when they cannot carry user data: booleans, and
 * the enumerated choices listed here. Everything else is redacted.
 */
const SAFE_FLAG_VALUES: Record<string, string[]> = {
  template: ["basic", "plugin", "registry"],
  tag: ["latest", "rc", "canary"],
};

type RunningCommand = {
  name: string;
  flags: Record<string, unknown>;
  cwd: string;
  startedAt: number;
};

let running: RunningCommand | null = null;

const redactFlags = (command: Command): Record<string, unknown> => {
  const flags: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(command.opts())) {
    if (command.getOptionValueSource(key) !== "cli") continue;
    if (typeof value === "boolean") {
      flags[key] = value;
    } else if (typeof value === "string" && SAFE_FLAG_VALUES[key]?.includes(value)) {
      flags[key] = value;
    } else {
      flags[key] = "<redacted>";
    }
  }
  return flags;
};

export const beginCommand = (command: Command) => {
  const opts = command.opts() as { cwd?: string };
  running = {
    name: command.name(),
    flags: redactFlags(command),
    cwd: typeof opts.cwd === "string" ? opts.cwd : process.cwd(),
    startedAt: Date.now(),
  };
};

export const finishCommand = async (exitCode: number, error?: unknown) => {
  if (!running) return;
  const current = running;
  running = null;

  await sendTelemetryEvent(
    {
      event: "cli_command_executed",
      properties: {
        command: current.name,
        flags: current.flags,
        exit_code: exitCode,
        duration_ms: Date.now() - current.startedAt,
        ...(exitCode !== 0 ? { error_category: categorizeError(error) } : {}),
      },
    },
    { cwd: current.cwd }
  );
};

export const registerCommandTracking = (program: Command) => {
  program.hook("preAction", (_this, actionCommand) => beginCommand(actionCommand));
  program.hook("postAction", async () => {
    await finishCommand(0);
  });
};
