import path from "path"
import { normalizePath, crawlModuleFiles } from "./utils"
import type { BuiltMercurConfig } from "./types"

/**
 * Custom-field configs carry runtime values (zod validation, render
 * components, default-value resolvers), so — unlike widgets — the emitted
 * module re-exports the actual default-exported config objects rather than a
 * build-time-extracted literal. The runtime `ExtensionRegistry` reads
 * `model` / `link` / `forms` / `displays` / `list` off each object.
 */
export function generateCustomFields({
    srcDir,
    pluginExtensions,
}: BuiltMercurConfig): string {
    const dir = path.join(srcDir, "custom-fields")
    const files = crawlModuleFiles(dir)

    const imports = files.map(
        (file, i) => `import __cf${i} from "${normalizePath(file)}"`
    )
    const localRefs = files.map((_, i) => `__cf${i}`)

    const pluginDeclarations = pluginExtensions.map(
        (ext, i) =>
            `const __plugin${i} = (await import("${normalizePath(ext)}")).default`
    )
    const pluginSpreads = pluginExtensions.map(
        (_, i) => `    ...(__plugin${i}.customFieldsModule?.configs ?? [])`
    )

    const configs = [
        ...localRefs.map((ref) => `    ${ref}`),
        ...pluginSpreads,
    ]

    if (configs.length === 0 && pluginDeclarations.length === 0) {
        return `export default { configs: [] }`
    }

    return `${imports.join("\n")}

${pluginDeclarations.join("\n")}

export default {
    configs: [
${configs.join(",\n")}
    ]
}`
}
