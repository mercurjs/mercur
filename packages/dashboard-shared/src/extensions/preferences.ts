import type {
  EntryPreference,
  LayoutPreferences,
  NavGroupConfig,
  NavItemOverride,
  ZonePreference,
} from "@mercurjs/dashboard-sdk"

/** Field-by-field merge per zone entry, later layers winning. */
export function mergeLayoutPreferences(layers: LayoutPreferences[]): LayoutPreferences {
  const result: LayoutPreferences = {}

  for (const layer of layers) {
    for (const [zone, preference] of Object.entries(layer ?? {})) {
      const current: ZonePreference = result[zone] ?? {}
      const entries = { ...(current.entries ?? {}) }
      for (const [id, entry] of Object.entries(preference.entries ?? {})) {
        entries[id] = { ...(entries[id] ?? {}), ...entry }
      }

      const groups = new Map((current.groups ?? []).map((group) => [group.id, group]))
      for (const group of preference.groups ?? []) {
        groups.set(group.id, { ...(groups.get(group.id) ?? {}), ...group })
      }

      result[zone] = {
        ...(Object.keys(entries).length ? { entries } : {}),
        ...(groups.size ? { groups: [...groups.values()] } : {}),
      }
    }
  }

  return result
}

export const NAV_ENTRY_PREFIX = "nav:"

const navId = (entryId: string) =>
  entryId.slice(NAV_ENTRY_PREFIX.length).replace(/^\//, "")

/**
 * Translates the sidebar zones of `_layouts.ts` (`nav:<path>` entries,
 * `groups`) into the override shape the sidebars already consume, layered over
 * the `_navigation.ts` overrides.
 */
export function navOverridesFromPreferences(
  navigation: { items: NavItemOverride<string>[]; groups: NavGroupConfig[] },
  zones: Array<ZonePreference | undefined>
): { items: NavItemOverride<string>[]; groups: NavGroupConfig[] } {
  const items = new Map(navigation.items.map((item) => [item.id, { ...item }]))
  const groups = new Map(navigation.groups.map((group) => [group.id, { ...group }]))

  for (const zone of zones) {
    for (const group of zone?.groups ?? []) {
      groups.set(group.id, { ...(groups.get(group.id) ?? {}), ...group })
    }
    for (const [entryId, entry] of Object.entries(zone?.entries ?? {})) {
      if (!entryId.startsWith(NAV_ENTRY_PREFIX)) continue
      const id = navId(entryId)
      items.set(id, { ...(items.get(id) ?? { id }), ...toNavOverride(id, entry) })
    }
  }

  return { items: [...items.values()], groups: [...groups.values()] }
}

function toNavOverride(id: string, entry: EntryPreference): NavItemOverride<string> {
  const override: NavItemOverride<string> = { id }
  if (entry.hidden !== undefined) override.hidden = entry.hidden
  if (entry.order !== undefined) override.rank = entry.order
  if (entry.label !== undefined) override.label = entry.label
  if (entry.icon !== undefined) override.icon = entry.icon
  if (entry.section !== undefined) override.group = entry.section
  if ("parent" in entry) {
    override.nested = entry.parent === null ? null : entry.parent?.replace(/^\//, "")
  }
  return override
}
