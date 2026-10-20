import { emitLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/** Deep-merged in layer order, so a later layer overrides a plugin's copy. */
export function generateI18n(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    // deepMerge is inlined because the virtual module has no runtime dependency on @mercurjs/admin.
    return `${header}

function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const a = target[key]
    const b = source[key]
    result[key] =
      a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)
        ? deepMerge(a, b)
        : b
  }
  return result
}

function mergeResources(target, source) {
  const result = { ...target }
  for (const lng of Object.keys(source)) {
    result[lng] = { ...(result[lng] ?? {}) }
    for (const ns of Object.keys(source[lng])) {
      result[lng][ns] = deepMerge(result[lng][ns] ?? {}, source[lng][ns])
    }
  }
  return result
}

export default [${names.map((name) => `(${name}.i18nModule ?? {})`).join(", ")}].reduce(mergeResources, {})
`
}
