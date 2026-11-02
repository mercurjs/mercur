import { emitLayers, spreadLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/**
 * Custom-field configs carry runtime values (zod validation, render
 * components, default-value resolvers), so the emitted module re-exports the
 * default-exported config objects in layer order; the runtime
 * `ExtensionRegistry` keys them so a later config replaces an earlier one.
 */
export function generateCustomFields(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

export default {
    configs: [
${spreadLayers(names, "customFieldsModule", "configs")}
    ]
}`
}
