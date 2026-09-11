import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath } from "./utils"
import type { BuiltMercurConfig } from "./types"

function findI18nIndex(srcDir: string): string | null {
    const i18nDir = path.join(srcDir, "i18n")

    if (!fs.existsSync(i18nDir)) {
        return null
    }

    for (const ext of VALID_FILE_EXTENSIONS) {
        const filePath = path.join(i18nDir, `index${ext}`)
        if (fs.existsSync(filePath)) {
            return filePath
        }
    }

    return null
}

export function generateI18n({ srcDir, pluginExtensions }: BuiltMercurConfig): string {
    const indexFile = findI18nIndex(srcDir)

    const imports = [
        ...(indexFile ? [`import appI18n from "${normalizePath(indexFile)}"`] : []),
        ...pluginExtensions.map(
            (ext, i) => `import __plugin${i} from "${normalizePath(ext)}"`
        ),
    ]

    // Plugins first, app last, so the host can override a plugin's copy.
    const sources = [
        ...pluginExtensions.map((_, i) => `(__plugin${i}.i18nModule ?? {})`),
        ...(indexFile ? ["appI18n"] : []),
    ]

    // deepMerge is inlined because the virtual module has no runtime dependency on @mercurjs/admin.
    return `${imports.join("\n")}

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

export default [${sources.join(", ")}].reduce(mergeResources, {})
`
}
