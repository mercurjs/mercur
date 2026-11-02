import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

interface TelemetryConfig {
  telemetry_enabled: boolean;
  notice_shown: boolean;
  device_id: string | null;
}

const DEFAULTS: TelemetryConfig = {
  telemetry_enabled: true,
  notice_shown: false,
  device_id: null,
};

/**
 * XDG config location, the same convention `@medusajs/telemetry` follows for
 * `~/.config/medusa/config.json`.
 */
export const resolveConfigDir = (env: NodeJS.ProcessEnv = process.env, platform = process.platform) => {
  if (platform === "win32") {
    return join(env.APPDATA || join(homedir(), "AppData", "Roaming"), "mercur");
  }
  return join(env.XDG_CONFIG_HOME || join(homedir(), ".config"), "mercur");
};

const LEGACY_CONFIG_PATH = join(homedir(), ".mercur", "config.json");

class ConfigStore {
  private readonly path: string;
  private readonly dir: string;

  constructor(dir = resolveConfigDir()) {
    this.dir = dir;
    this.path = join(dir, "config.json");
  }

  get<K extends keyof TelemetryConfig>(key: K): TelemetryConfig[K] {
    return this.read()[key];
  }

  set<K extends keyof TelemetryConfig>(key: K, value: TelemetryConfig[K]): void {
    const config = this.read();
    config[key] = value;
    this.write(config);
  }

  deviceId(): string {
    const existing = this.get("device_id");
    if (existing) {
      return existing;
    }
    const id = randomUUID();
    this.set("device_id", id);
    return id;
  }

  private read(): TelemetryConfig {
    try {
      if (existsSync(this.path)) {
        return { ...DEFAULTS, ...JSON.parse(readFileSync(this.path, "utf-8")) };
      }
      return this.migrateLegacy();
    } catch {
      return { ...DEFAULTS };
    }
  }

  // Carries an opt-out made under the old ~/.mercur location across the move.
  private migrateLegacy(): TelemetryConfig {
    const config = { ...DEFAULTS };
    try {
      if (existsSync(LEGACY_CONFIG_PATH)) {
        const legacy = JSON.parse(readFileSync(LEGACY_CONFIG_PATH, "utf-8"));
        if (typeof legacy.telemetry_enabled === "boolean") {
          config.telemetry_enabled = legacy.telemetry_enabled;
        }
        if (typeof legacy.notice_shown === "boolean") {
          config.notice_shown = legacy.notice_shown;
        }
        this.write(config);
      }
    } catch {
      // Unreadable legacy file: fall back to defaults.
    }
    return config;
  }

  private write(config: TelemetryConfig): void {
    try {
      mkdirSync(this.dir, { recursive: true, mode: 0o700 });
      writeFileSync(this.path, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
    } catch {
      // Telemetry config is non-critical.
    }
  }
}

export const configStore = new ConfigStore();
