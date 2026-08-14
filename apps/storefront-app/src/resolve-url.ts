import { networkInterfaces } from "node:os";

import { DEFAULT_DEV_PORT, DEFAULT_PRODUCTION_URL } from "./identity";

export type ShellTarget =
  | "web"
  | "desktop"
  | "ios-simulator"
  | "android-emulator"
  | "device";

export function lanIPv4(): string | null {
  try {
    const nets = networkInterfaces();

    for (const addrs of Object.values(nets)) {
      for (const net of addrs ?? []) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveStorefrontUrl(
  target: ShellTarget,
  port: number = DEFAULT_DEV_PORT
): string {
  if (process.env.STOREFRONT_URL) {
    return process.env.STOREFRONT_URL;
  }

  if (process.env.NODE_ENV === "production" && target === "desktop") {
    return process.env.MERCUR_STOREFRONT_URL ?? DEFAULT_PRODUCTION_URL;
  }

  switch (target) {
    case "web":
    case "desktop":
    case "ios-simulator":
      return `http://127.0.0.1:${port}`;
    case "android-emulator":
      return `http://10.0.2.2:${port}`;
    case "device": {
      const ip = lanIPv4();

      if (!ip) {
        throw new Error(
          "No LAN IPv4 address found. Connect to Wi-Fi or set STOREFRONT_URL."
        );
      }

      return `http://${ip}:${port}`;
    }
  }
}
