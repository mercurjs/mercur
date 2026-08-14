"use client"

import { Card } from "@/components/atoms"
import { useTheme } from "@/components/providers/Theme/use-theme"
import {
  GLASS_LABELS,
  GLASS_OPTIONS,
  THEME_LABELS,
  THEME_OPTIONS,
  type GlassOption,
  type ThemeOption,
} from "@/lib/theme"

export function ThemeAppearance() {
  const { theme, setTheme, liquidGlass, setLiquidGlass } = useTheme()

  return (
    <Card className="mt-8 p-0" data-testid="theme-appearance">
      <div className="p-4">
        <h2 className="heading-sm uppercase" data-testid="theme-appearance-heading">
          Appearance
        </h2>
        <p className="label-md text-secondary mt-1">
          Light, dark, or match your device. You can also change this from the sun / moon
          icon in the header.
        </p>
      </div>
      <div
        className="flex flex-wrap gap-2 px-4 pb-4"
        role="radiogroup"
        aria-label="Theme"
      >
        {THEME_OPTIONS.map((option: ThemeOption) => {
          const selected = theme === option

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`label-md rounded-sm border px-4 py-2 ${
                selected
                  ? "border-secondary bg-action text-action-on-primary"
                  : "border-primary bg-component hover:bg-component-hover"
              }`}
              data-testid={`theme-appearance-${option}`}
              onClick={() => setTheme(option)}
            >
              {THEME_LABELS[option]}
            </button>
          )
        })}
      </div>
      <div className="border-t p-4">
        <h3 className="heading-sm uppercase" data-testid="liquid-glass-heading">
          Liquid glass
        </h3>
        <p className="label-md text-secondary mt-1">
          Optional frosted, refractive surfaces on the header, cards, and menus. Off by
          default.
        </p>
      </div>
      <div
        className="flex flex-wrap gap-2 px-4 pb-4"
        role="radiogroup"
        aria-label="Liquid glass"
      >
        {GLASS_OPTIONS.map((option: GlassOption) => {
          const selected = liquidGlass === (option === "on")

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`label-md rounded-sm border px-4 py-2 ${
                selected
                  ? "border-secondary bg-action text-action-on-primary"
                  : "border-primary bg-component hover:bg-component-hover"
              }`}
              data-testid={`liquid-glass-${option}`}
              onClick={() => setLiquidGlass(option === "on")}
            >
              {GLASS_LABELS[option]}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
