"use client"

import { useEffect, useRef, useState } from "react"

import { Dropdown } from "@/components/molecules/Dropdown/Dropdown"
import { useTheme } from "@/components/providers/Theme/use-theme"
import { MoonIcon, SunIcon } from "@/icons"
import { THEME_LABELS, THEME_OPTIONS, type ThemeOption } from "@/lib/theme"

export function ThemeToggle() {
  const { theme, setTheme, liquidGlass, setLiquidGlass } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  return (
    <div
      ref={rootRef}
      className="relative"
      data-testid="theme-toggle"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${THEME_LABELS[theme]}. Liquid glass ${liquidGlass ? "on" : "off"}. Change appearance`}
        className="flex h-10 w-10 items-center justify-center rounded-sm hover:bg-action-secondary-hover active:bg-action-secondary-pressed"
        data-testid="theme-toggle-button"
        onClick={() => setOpen((current) => !current)}
      >
        <SunIcon size={20} className="dark:hidden" />
        <MoonIcon size={20} className="hidden dark:block" />
      </button>
      <Dropdown show={open}>
        <div
          className="min-w-[168px] p-1"
          role="listbox"
          aria-label="Appearance"
        >
          {THEME_OPTIONS.map((option: ThemeOption) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={theme === option}
              className={`label-md block w-full rounded-sm px-4 py-2 text-left hover:bg-component-hover ${
                theme === option ? "text-primary" : "text-secondary"
              }`}
              data-testid={`theme-option-${option}`}
              onClick={() => {
                setTheme(option)
                setOpen(false)
              }}
            >
              {THEME_LABELS[option]}
            </button>
          ))}
          <div className="mx-2 my-1 border-t border-primary" />
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={liquidGlass}
            className={`label-md flex w-full items-center justify-between rounded-sm px-4 py-2 text-left hover:bg-component-hover ${
              liquidGlass ? "text-primary" : "text-secondary"
            }`}
            data-testid="liquid-glass-toggle"
            onClick={() => {
              setLiquidGlass(!liquidGlass)
            }}
          >
            <span>Liquid glass</span>
            <span className="label-sm">{liquidGlass ? "On" : "Off"}</span>
          </button>
        </div>
      </Dropdown>
    </div>
  )
}
