import { createElement, type ReactNode } from "react"
import type { NavGroupConfig, NavItemOverride } from "@mercurjs/dashboard-sdk"

export type CoreNavItem = {
  id: string
  label: string
  to: string
  icon?: ReactNode
  items?: CoreNavItem[]
}

type Flat = {
  item: CoreNavItem
  parentId: string | null
  rank: number
  hidden: boolean
}

/**
 * Applies host-owned `_navigation.ts` overrides to a panel's built-in core
 * routes: reorder (`rank`), hide (`hidden`), relabel (`label`/`icon`), and
 * re-parent (`nested`). Operates on the two-level `useCoreRoutes()` shape;
 * items without a matching override are preserved in their original order.
 */
export function applyNavOverrides(
  coreRoutes: CoreNavItem[],
  overrides: NavItemOverride[] = []
): CoreNavItem[] {
  const overrideById = new Map<string, NavItemOverride>()
  for (const o of overrides) {
    if (o?.id) overrideById.set(o.id, o)
  }

  const flat: Flat[] = []
  let order = 0

  const push = (item: CoreNavItem, parentId: string | null) => {
    const o = overrideById.get(item.id)
    const reparent = o && "nested" in o ? o.nested ?? null : parentId
    flat.push({
      item: {
        ...item,
        label: o?.label ?? item.label,
        icon: o?.icon ? createElement(o.icon) : item.icon,
        items: undefined,
      },
      parentId: reparent,
      rank: o?.rank ?? order++,
      hidden: o?.hidden ?? false,
    })
  }

  for (const top of coreRoutes) {
    push(top, null)
    for (const child of top.items ?? []) {
      push(child, top.id)
    }
  }

  const visible = flat.filter((f) => !f.hidden)
  const byRank = (a: Flat, b: Flat) => a.rank - b.rank

  const childrenOf = (parentId: string) =>
    visible
      .filter((f) => f.parentId === parentId)
      .sort(byRank)
      .map((f) => f.item)

  return visible
    .filter((f) => f.parentId === null)
    .sort(byRank)
    .map((f) => {
      const items = childrenOf(f.item.id)
      return items.length ? { ...f.item, items } : f.item
    })
}

export type NavGroupItem = {
  id: string
  label: string
  to: string
  translationNs?: string
}

export type NavGroup = {
  id: string
  label: string
  translationNs?: string
  items: NavGroupItem[]
}

type ExtensionNavGroupItem = NavGroupItem & { group?: string; rank?: number }

/**
 * Resolves the grouped settings sidebar: the panel's built-in groups, plus the
 * groups and per-item overrides (`group`/`rank`/`hidden`/`label`) from the
 * host's `_navigation.ts`, plus extension routes placed by their route
 * config's `group`. An unknown group id falls back to the first built-in
 * group, extension routes list after a group's built-in items, and groups
 * left without items are dropped.
 */
export function applyNavGroups(
  coreGroups: NavGroup[],
  extensionItems: ExtensionNavGroupItem[] = [],
  config: {
    groups?: NavGroupConfig[]
    items?: NavItemOverride<string>[]
  } = {}
): NavGroup[] {
  type Def = Omit<NavGroup, "items"> & { rank: number; hidden: boolean }

  const defs = new Map<string, Def>()
  coreGroups.forEach((group, index) => {
    defs.set(group.id, {
      id: group.id,
      label: group.label,
      translationNs: group.translationNs,
      rank: index,
      hidden: false,
    })
  })

  let nextRank = coreGroups.length
  for (const group of config.groups ?? []) {
    if (!group?.id) continue
    const existing = defs.get(group.id)
    defs.set(group.id, {
      id: group.id,
      label: group.label ?? existing?.label ?? group.id,
      translationNs: group.label ? group.translationNs : existing?.translationNs,
      rank: group.rank ?? existing?.rank ?? nextRank++,
      hidden: group.hidden ?? existing?.hidden ?? false,
    })
  }

  const fallbackId = coreGroups[0]?.id
  const resolveGroup = (id: string | undefined, defaultId?: string) =>
    id && defs.has(id) ? id : defaultId ?? fallbackId

  const overrideById = new Map<string, NavItemOverride<string>>()
  for (const o of config.items ?? []) {
    if (o?.id) overrideById.set(o.id, o)
  }

  const buckets = new Map<string, { item: NavGroupItem; rank: number }[]>()
  const place = (groupId: string | undefined, item: NavGroupItem, rank: number) => {
    if (!groupId) return
    const bucket = buckets.get(groupId) ?? []
    bucket.push({ item, rank })
    buckets.set(groupId, bucket)
  }

  let order = 0
  for (const group of coreGroups) {
    for (const item of group.items) {
      const o = overrideById.get(item.id)
      const rank = o?.rank ?? order++
      if (o?.hidden) continue
      place(
        resolveGroup(o?.group, group.id),
        { ...item, label: o?.label ?? item.label },
        rank
      )
    }
  }

  const extensions = new Map<string, { item: NavGroupItem; rank: number }[]>()
  for (const { group, rank, ...item } of extensionItems) {
    const groupId = resolveGroup(group)
    if (!groupId) continue
    const bucket = extensions.get(groupId) ?? []
    bucket.push({ item, rank: rank ?? 0 })
    extensions.set(groupId, bucket)
  }

  const byRank = (a: { rank: number }, b: { rank: number }) => a.rank - b.rank

  return [...defs.values()]
    .filter((def) => !def.hidden)
    .sort(byRank)
    .map(({ id, label, translationNs }) => ({
      id,
      label,
      translationNs,
      items: [
        ...(buckets.get(id) ?? []).sort(byRank),
        ...(extensions.get(id) ?? []).sort(byRank),
      ].map(({ item }) => item),
    }))
    .filter((group) => group.items.length > 0)
}

export type NavItemGroup<T> = {
  id: string
  label: string
  translationNs?: string
  items: T[]
}

/**
 * Splits main sidebar items into the ungrouped list and the groups declared in
 * the host's `_navigation.ts`. The main sidebar has no built-in groups, so an
 * item whose group isn't declared stays ungrouped. Item order is preserved.
 */
export function groupNavItems<T extends { group?: string }>(
  items: T[],
  groups: NavGroupConfig[] = []
): { ungrouped: T[]; groups: NavItemGroup<T>[] } {
  const defs = new Map<string, NavGroupConfig & { rank: number }>()
  groups.forEach((group, index) => {
    if (group?.id) defs.set(group.id, { ...group, rank: group.rank ?? index })
  })

  const ungrouped: T[] = []
  const buckets = new Map<string, T[]>()
  for (const item of items) {
    const def = item.group ? defs.get(item.group) : undefined
    if (!def) {
      ungrouped.push(item)
      continue
    }
    if (def.hidden) continue
    const bucket = buckets.get(def.id) ?? []
    bucket.push(item)
    buckets.set(def.id, bucket)
  }

  return {
    ungrouped,
    groups: [...defs.values()]
      .filter((def) => buckets.has(def.id))
      .sort((a, b) => a.rank - b.rank)
      .map((def) => ({
        id: def.id,
        label: def.label ?? def.id,
        translationNs: def.label ? def.translationNs : undefined,
        items: buckets.get(def.id) ?? [],
      })),
  }
}
