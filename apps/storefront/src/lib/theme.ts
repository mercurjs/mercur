export const THEME_STORAGE_KEY = "mercur_storefront_theme"
export const GLASS_STORAGE_KEY = "mercur_storefront_liquid_glass"
export const GLASS_CLASS = "liquid-glass"

export const THEME_OPTIONS = ["light", "dark", "system"] as const
export const GLASS_OPTIONS = ["off", "on"] as const

export type ThemeOption = (typeof THEME_OPTIONS)[number]
export type ThemeValue = "light" | "dark"
export type GlassOption = (typeof GLASS_OPTIONS)[number]

export const THEME_LABELS: Record<ThemeOption, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

export const GLASS_LABELS: Record<GlassOption, string> = {
  off: "Off",
  on: "On",
}

export function isThemeOption(value: string | null): value is ThemeOption {
  return value === "light" || value === "dark" || value === "system"
}

export function isGlassOption(value: string | null): value is GlassOption {
  return value === "on" || value === "off"
}

export function resolveThemeValue(
  theme: ThemeOption,
  prefersDark: boolean
): ThemeValue {
  if (theme === "system") {
    return prefersDark ? "dark" : "light"
  }

  return theme
}

export function applyThemeClass(value: ThemeValue, root: HTMLElement) {
  root.classList.remove("light", "dark")
  root.classList.add(value)
  root.style.colorScheme = value
}

export function applyGlassClass(enabled: boolean, root: HTMLElement) {
  root.classList.toggle(GLASS_CLASS, enabled)
}

export const THEME_INIT_SCRIPT = `(function(){try{var e=document.documentElement;var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");e.classList.remove("light","dark");e.classList.add(t);e.style.colorScheme=t;if(localStorage.getItem(${JSON.stringify(GLASS_STORAGE_KEY)})==="on"){e.classList.add(${JSON.stringify(GLASS_CLASS)});}else{e.classList.remove(${JSON.stringify(GLASS_CLASS)});} }catch(e){}})();`
