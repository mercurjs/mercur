import os from "os";
import { join } from "path";


interface TelemetryConfig {
  "telemetry_enabled": boolean;
  "telemetry_email": string | null;
}

class ConfigStore {
  private config: TelemetryConfig;
  public path: string = join(os.tmpdir(), "mercur");

  constructor() {
    this.config = this.createBaseConfig();
  }

  private createBaseConfig(): TelemetryConfig {
    return {
      "telemetry_enabled": true,
      "telemetry_email": null,
    };
  }

  get<K extends keyof TelemetryConfig>(key: K): TelemetryConfig[K] {
    return this.config[key];
  }

  set<K extends keyof TelemetryConfig>(key: K, value: TelemetryConfig[K]): void {
    this.config[key] = value;
  }

  all(): TelemetryConfig {
    return this.config;
  }

  size(): number {
    return Object.keys(this.config).length;
  }

  has(key: keyof TelemetryConfig): boolean {
    return key in this.config && this.config[key] !== undefined;
  }

  del(key: keyof TelemetryConfig): void {
    delete this.config[key];
  }

  clear(): void {
    this.config = this.createBaseConfig();
  }
}

export const configStore = new ConfigStore();

