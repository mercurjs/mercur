import {
  Children,
  Fragment,
  createElement,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react"
import type { ZonePreference } from "@mercurjs/dashboard-sdk"
import type { SectionWidgetMap } from "../extensions/registry"
import { LayoutEntry, type LayoutEntryProps } from "./entry"
import type { DisplayEntry, RawEntry } from "./types"

export const CORE_ENTRY_PREFIX = "core:"

function getElementName(element: ReactElement): string {
  const { type } = element
  if (typeof type === "string") return type
  return (type as ComponentType).displayName ?? (type as ComponentType).name ?? "unknown"
}

function isLayoutEntry(element: ReactElement): element is ReactElement<LayoutEntryProps> {
  return element.type === LayoutEntry
}

function getCoreEntryKey(element: ReactElement): string {
  return isLayoutEntry(element) ? element.props.id : getElementName(element)
}

function collectElements(node: ReactNode): ReactElement[] {
  const elements: ReactElement[] = []
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) {
      elements.push(...collectElements((child.props as { children?: ReactNode }).children))
      return
    }
    elements.push(child)
  })
  return elements
}

export function extractSectionElements(
  sections: Record<string, ReactNode>
): Record<string, ReactElement[]> {
  const result: Record<string, ReactElement[]> = {}
  for (const [section, node] of Object.entries(sections)) {
    result[section] = collectElements(node)
  }
  return result
}

/**
 * One entry per element across all sections, in source order. Duplicate ids
 * get a `#n` suffix from one counter shared across sections, so two same-named
 * entries stay distinct. The id omits the section so an entry keeps its
 * identity (and its preference) when its natural section changes in code.
 */
export function buildCoreEntries(elementsBySection: Record<string, ReactElement[]>): RawEntry[] {
  const entries: RawEntry[] = []
  const seen = new Map<string, number>()

  for (const [section, elements] of Object.entries(elementsBySection)) {
    for (const element of elements) {
      const base = `${CORE_ENTRY_PREFIX}${getCoreEntryKey(element)}`
      const count = seen.get(base) ?? 0
      seen.set(base, count + 1)
      entries.push({
        entryId: count === 0 ? base : `${base}#${count + 1}`,
        render: () => element,
        naturalSection: section,
      })
    }
  }

  return entries
}

export function buildWidgetEntries(widgets: SectionWidgetMap): RawEntry[] {
  const entries: RawEntry[] = []
  for (const [section, list] of Object.entries(widgets)) {
    for (const widget of list) {
      const Component = widget.Component
      entries.push({
        entryId: widget.widgetId,
        render: (data, renderDefault?: () => ReactNode) =>
          createElement(Component, { data, renderDefault }),
        naturalSection: section,
        order: widget.order,
        replace: widget.replace,
      })
    }
  }
  return entries
}

const warned = new Set<string>()

/**
 * Lets a widget with `replace` take the slot of the entry it names: same
 * section and order, and the replaced entry becomes its `renderDefault`. A
 * target that is not on the page is reported once and the widget appends.
 */
export function applyReplacements(core: RawEntry[], widgets: RawEntry[]): RawEntry[] {
  const result = [...core]

  for (const widget of widgets) {
    const target = widget.replace ? result.findIndex((e) => e.entryId === widget.replace) : -1

    if (target === -1) {
      if (widget.replace && !warned.has(widget.replace)) {
        warned.add(widget.replace)
        console.warn(
          `[mercur] Widget "${widget.entryId}" replaces "${widget.replace}", which this page does not render; rendering it after the section instead.`
        )
      }
      result.push(widget)
      continue
    }

    const replaced = result[target]
    const render = widget.render as (data: unknown, renderDefault?: () => ReactNode) => ReactNode
    result[target] = {
      entryId: widget.entryId,
      naturalSection: replaced.naturalSection,
      order: replaced.order,
      render: (data) => render(data, () => replaced.render(data)),
    }
  }

  return result
}

/**
 * Applies a zone's preference to the raw entries: effective section (a section
 * the layout does not render falls back to the natural one), order (preference,
 * then the widget's own, then 0 so source order holds) and hidden.
 */
export function buildDisplayEntries(
  raw: RawEntry[],
  preference: ZonePreference,
  validSections: Set<string>
): Record<string, DisplayEntry[]> {
  const result: Record<string, DisplayEntry[]> = {}

  for (const entry of raw) {
    const pref = preference.entries?.[entry.entryId]
    const section =
      pref?.section && validSections.has(pref.section) ? pref.section : entry.naturalSection
    if (!validSections.has(section)) continue

    result[section] ??= []
    result[section].push({
      entryId: entry.entryId,
      render: entry.render,
      order: pref?.order ?? entry.order ?? 0,
      hidden: pref?.hidden ?? false,
    })
  }

  for (const section of Object.keys(result)) {
    result[section].sort((a, b) => a.order - b.order)
  }

  return result
}
