import { emitLayers, spreadLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/** A later gate with the same id replaces the earlier one. */
export function generateGates(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

const byId = new Map()
for (const gate of [
${spreadLayers(names, "gateModule", "gates")}
]) {
    byId.set(gate.id, gate)
}

export default { gates: [...byId.values()] }`
}
