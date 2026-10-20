import { collectLayer } from "./layers"

/**
 * Generates a plugin entry module for a given source directory (e.g.
 * src/vendor): the same shape the Vite plugin crawls for the project and host
 * layers, so a prebuilt plugin merges exactly like a source folder.
 */
export function generatePluginEntryModule(srcDir: string): string {
    const { imports, declaration, name } = collectLayer(srcDir, 0)

    return `// Auto-generated plugin extensions entry
${imports.join("\n")}

${declaration}

export default ${name}
`
}
