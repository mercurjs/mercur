import { createElement, type ReactNode } from "react"
import type { NavItemOverride } from "@mercurjs/dashboard-sdk"

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
