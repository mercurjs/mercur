import { emitLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/**
 * One `_layouts.ts` preference object per layer, in order. Merging happens in
 * the runtime registry, field by field per zone entry, later layers winning.
 */
export function generatePreferences(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

export default { layers: [${names.map((name) => `${name}.preferenceModule ?? {}`).join(", ")}] }`
}
