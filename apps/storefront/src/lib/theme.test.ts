import { describe, expect, test } from "bun:test"

import {
  GLASS_CLASS,
  GLASS_STORAGE_KEY,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  applyGlassClass,
  applyThemeClass,
  isGlassOption,
  isThemeOption,
  resolveThemeValue,
} from "./theme"

describe("isThemeOption", () => {
  test("accepts light, dark, and system", () => {
    expect(isThemeOption("light")).toBe(true)
    expect(isThemeOption("dark")).toBe(true)
    expect(isThemeOption("system")).toBe(true)
  })

  test("rejects unknown values", () => {
    expect(isThemeOption("auto")).toBe(false)
    expect(isThemeOption(null)).toBe(false)
  })
})

describe("isGlassOption", () => {
  test("accepts on and off", () => {
    expect(isGlassOption("on")).toBe(true)
    expect(isGlassOption("off")).toBe(true)
  })

  test("rejects unknown values", () => {
    expect(isGlassOption("true")).toBe(false)
    expect(isGlassOption(null)).toBe(false)
  })
})

describe("resolveThemeValue", () => {
  test("returns an explicit light or dark choice", () => {
    expect(resolveThemeValue("light", true)).toBe("light")
    expect(resolveThemeValue("dark", false)).toBe("dark")
  })

  test("follows the system preference", () => {
    expect(resolveThemeValue("system", true)).toBe("dark")
    expect(resolveThemeValue("system", false)).toBe("light")
  })
})

describe("applyThemeClass", () => {
  test("sets the html class and color-scheme", () => {
    const root = {
      classList: {
        removed: [] as string[],
        added: [] as string[],
        remove(...tokens: string[]) {
          this.removed.push(...tokens)
        },
        add(...tokens: string[]) {
          this.added.push(...tokens)
        },
      },
      style: { colorScheme: "" },
    }

    applyThemeClass("dark", root as unknown as HTMLElement)

    expect(root.classList.removed).toEqual(["light", "dark"])
    expect(root.classList.added).toEqual(["dark"])
    expect(root.style.colorScheme).toBe("dark")
  })
})

describe("applyGlassClass", () => {
  test("toggles the liquid-glass class", () => {
    const toggled: Array<{ token: string; force: boolean }> = []
    const root = {
      classList: {
        toggle(token: string, force: boolean) {
          toggled.push({ token, force })
        },
      },
    }

    applyGlassClass(true, root as unknown as HTMLElement)
    applyGlassClass(false, root as unknown as HTMLElement)

    expect(toggled).toEqual([
      { token: GLASS_CLASS, force: true },
      { token: GLASS_CLASS, force: false },
    ])
  })
})

describe("theme bootstrap script", () => {
  test("reads the storefront storage key before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY)
    expect(THEME_INIT_SCRIPT).toContain("prefers-color-scheme: dark")
    expect(THEME_INIT_SCRIPT).toContain("colorScheme")
  })

  test("applies liquid glass from storage before paint", () => {
    expect(THEME_INIT_SCRIPT).toContain(GLASS_STORAGE_KEY)
    expect(THEME_INIT_SCRIPT).toContain(GLASS_CLASS)
  })
})
