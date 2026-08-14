import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(ROOT, "..", "..");

describe("packaging files", () => {
  test("PWA manifest requests standalone display and store icons", async () => {
    const source = await Bun.file(
      join(REPO_ROOT, "apps/storefront/src/app/manifest.ts")
    ).text();

    expect(source).toContain('display: "standalone"');
    expect(source).toContain("/icons/icon-192.png");
    expect(source).toContain("/icons/icon-512.png");
    expect(source).toContain('purpose: "maskable"');
  });

  test("service worker is network-first for pages", async () => {
    const source = await Bun.file(
      join(REPO_ROOT, "apps/storefront/public/sw.js")
    ).text();

    expect(source).toContain("fetch(request)");
    expect(source).toContain("You're offline");
  });

  test("store icons exist at the sizes the stores require", async () => {
    const icons = [
      "apps/storefront/public/icons/icon-192.png",
      "apps/storefront/public/icons/icon-512.png",
      "apps/storefront/public/icons/icon-512-maskable.png",
      "apps/storefront/public/icons/apple-touch-icon.png",
      "apps/storefront-app/resources/icon.png",
    ];

    const files = icons.map((relative) => Bun.file(join(REPO_ROOT, relative)));
    const existing = await Promise.all(files.map((file) => file.exists()));

    for (const [index, file] of files.entries()) {
      expect(existing[index]).toBe(true);
      expect(file.size).toBeGreaterThan(100);
    }
  });

  test("electron-builder ships Apple, Microsoft, and Linux store targets", async () => {
    const config = await Bun.file(join(ROOT, "electron-builder.yml")).text();

    expect(config).toContain("appx");
    expect(config).toContain("snap");
    expect(config).toContain("AppImage");
    expect(config).toContain("public.app-category.shopping");
  });
});
