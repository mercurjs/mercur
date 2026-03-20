import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface TelemetryConfig {
  telemetry_enabled: boolean;
  telemetry_email: string | null;
  notice_shown: boolean;
}

const CONFIG_DIR = join(homedir(), ".mercur");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULTS: TelemetryConfig = {
  telemetry_enabled: true,
  telemetry_email: null,
  notice_shown: false,
};

class ConfigStore {
  get<K extends keyof TelemetryConfig>(key: K): TelemetryConfig[K] {
    const config = this.read();
    return config[key];
  }

  set<K extends keyof TelemetryConfig>(key: K, value: TelemetryConfig[K]): void {
    const config = this.read();
    config[key] = value;
    this.write(config);
  }

  private read(): TelemetryConfig {
    try {
      if (!existsSync(CONFIG_PATH)) {
        return { ...DEFAULTS };
      }
      const raw = readFileSync(CONFIG_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private write(config: TelemetryConfig): void {
    try {
      mkdirSync(CONFIG_DIR, { recursive: true });
      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", {
        mode: 0o600,
      });
    } catch {
      // Silently fail — telemetry config is non-critical
    }
  }
}

export const configStore = new ConfigStore();
