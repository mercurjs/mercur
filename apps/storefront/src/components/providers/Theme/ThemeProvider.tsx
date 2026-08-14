"use client"

import { PropsWithChildren, useCallback, useEffect, useState } from "react"

import {
  GLASS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  applyGlassClass,
  applyThemeClass,
  isGlassOption,
  isThemeOption,
  resolveThemeValue,
  type ThemeOption,
  type ThemeValue,
} from "@/lib/theme"

import { ThemeContext } from "./theme-context"

function readStoredTheme(): ThemeOption {
  if (typeof window === "undefined") {
    return "system"
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return isThemeOption(stored) ? stored : "system"
}

function readStoredGlass(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  const stored = window.localStorage.getItem(GLASS_STORAGE_KEY)
  return isGlassOption(stored) ? stored === "on" : false
}

function prefersDarkScheme(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function readDocumentTheme(): ThemeValue {
  if (typeof document === "undefined") {
    return "light"
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeOption>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ThemeValue>(readDocumentTheme)
  const [liquidGlass, setLiquidGlassState] = useState(false)

  const apply = useCallback((next: ThemeOption) => {
    const value = resolveThemeValue(next, prefersDarkScheme())
    setThemeState(next)
    setResolvedTheme(value)

    if (typeof document !== "undefined") {
      applyThemeClass(value, document.documentElement)
    }
  }, [])

  const setTheme = useCallback(
    (next: ThemeOption) => {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
      apply(next)
    },
    [apply]
  )

  const setLiquidGlass = useCallback((enabled: boolean) => {
    window.localStorage.setItem(GLASS_STORAGE_KEY, enabled ? "on" : "off")
    setLiquidGlassState(enabled)

    if (typeof document !== "undefined") {
      applyGlassClass(enabled, document.documentElement)
    }
  }, [])

  useEffect(() => {
    apply(readStoredTheme())

    const glass = readStoredGlass()
    setLiquidGlassState(glass)
    applyGlassClass(glass, document.documentElement)

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const stored = readStoredTheme()
      if (stored === "system") {
        apply(stored)
      }
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [apply])

  useEffect(() => {
    if (!liquidGlass) {
      document.documentElement.style.removeProperty("--glass-spot-x")
      document.documentElement.style.removeProperty("--glass-spot-y")
      return
    }

    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const root = document.documentElement
        root.style.setProperty("--glass-spot-x", `${event.clientX}px`)
        root.style.setProperty("--glass-spot-y", `${event.clientY}px`)
      })
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
    }
  }, [liquidGlass])

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, liquidGlass, setLiquidGlass }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
