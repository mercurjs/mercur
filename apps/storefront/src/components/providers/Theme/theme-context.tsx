"use client"

import { createContext } from "react"

import type { ThemeOption, ThemeValue } from "@/lib/theme"

type ThemeContextValue = {
  theme: ThemeOption
  resolvedTheme: ThemeValue
  setTheme: (theme: ThemeOption) => void
  liquidGlass: boolean
  setLiquidGlass: (enabled: boolean) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
