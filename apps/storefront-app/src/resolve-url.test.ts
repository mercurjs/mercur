import { afterEach, describe, expect, test } from "bun:test";

import { APP_DESCRIPTION, APP_ID, APP_NAME, URL_SCHEME } from "../src/identity";
import { resolveStorefrontUrl } from "../src/resolve-url";

const ORIGINAL_STOREFRONT_URL = process.env.STOREFRONT_URL;

afterEach(() => {
  if (ORIGINAL_STOREFRONT_URL === undefined) {
    delete process.env.STOREFRONT_URL;
    return;
  }

  process.env.STOREFRONT_URL = ORIGINAL_STOREFRONT_URL;
});

describe("store identity", () => {
  test("uses a reverse-DNS application id", () => {
    expect(APP_ID).toMatch(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/);
  });

  test("has store listing fields", () => {
    expect(APP_NAME).toBe("Mercur");
    expect(APP_DESCRIPTION.length).toBeGreaterThan(10);
    expect(URL_SCHEME).toBe("mercur");
  });
});

describe("resolveStorefrontUrl", () => {
  test("honors STOREFRONT_URL", () => {
    process.env.STOREFRONT_URL = "https://shop.example.com";
    expect(resolveStorefrontUrl("desktop")).toBe("https://shop.example.com");
    expect(resolveStorefrontUrl("device")).toBe("https://shop.example.com");
  });

  test("points simulators at loopback", () => {
    delete process.env.STOREFRONT_URL;
    expect(resolveStorefrontUrl("ios-simulator")).toBe("http://127.0.0.1:3000");
    expect(resolveStorefrontUrl("desktop")).toBe("http://127.0.0.1:3000");
    expect(resolveStorefrontUrl("web")).toBe("http://127.0.0.1:3000");
  });

  test("points the Android emulator at the host loopback alias", () => {
    delete process.env.STOREFRONT_URL;
    expect(resolveStorefrontUrl("android-emulator")).toBe("http://10.0.2.2:3000");
  });

  test("points physical devices at a LAN address", () => {
    delete process.env.STOREFRONT_URL;

    try {
      const url = resolveStorefrontUrl("device");
      expect(url).toMatch(/^http:\/\/\d{1,3}(?:\.\d{1,3}){3}:3000$/);
      expect(url).not.toContain("127.0.0.1");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(String(error)).toContain("No LAN IPv4");
    }
  });
});
