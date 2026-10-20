import { emitLayers, spreadLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/** A later layout with the same id replaces the earlier one; `core:` ids are reserved. */
export function generateLayouts(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

const byId = new Map()
for (const layout of [
${spreadLayers(names, "layoutModule", "layouts")}
]) {
    if (layout?.id) byId.set(layout.id, layout)
}

export default { layouts: [...byId.values()] }`
}
