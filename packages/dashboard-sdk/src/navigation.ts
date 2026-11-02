import { emitLayers } from "./layers"
import type { BuiltMercurConfig } from "./types"

/**
 * `_navigation.ts` overrides from every layer, merged in order: groups and
 * items with the same id are combined field by field, later layers winning.
 */
export function generateNavigation(config: BuiltMercurConfig): string {
    const { header, names } = emitLayers(config)

    return `${header}

const groups = new Map()
const items = new Map()
for (const navigation of [${names.map((name) => `${name}.navigationModule ?? {}`).join(", ")}]) {
    for (const group of navigation.groups ?? []) {
        if (group?.id) groups.set(group.id, { ...(groups.get(group.id) ?? {}), ...group })
    }
    for (const item of navigation.items ?? []) {
        if (item?.id) items.set(item.id, { ...(items.get(item.id) ?? {}), ...item })
    }
}

export default { groups: [...groups.values()], items: [...items.values()] }`
}
