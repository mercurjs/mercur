import type { ComponentType } from "react"
import type {
  CustomDisplayField,
  CustomFieldsConfig,
  CustomFormField,
  CustomListExtension,
  NavItemOverride,
  SectionAction,
} from "@mercurjs/dashboard-sdk"

export type WidgetPlacement = "before" | "after"

export type Widget = {
  Component: ComponentType<{ data?: unknown }>
  zone: string[]
  widgetId: string
}

export type WidgetModule = { widgets?: Widget[] }
export type NavigationModule = { items?: NavItemOverride[] }
export type CustomFieldsModule = { configs?: CustomFieldsConfig[] }

export type ResolvedFormField = { name: string; field: CustomFormField }
export type ResolvedDisplays = {
  fields: CustomDisplayField[]
  actions: SectionAction[]
}

type ResolvedWidget = { Component: Widget["Component"]; widgetId: string }

export type ZoneWidgets = {
  before: ResolvedWidget[]
  after: ResolvedWidget[]
}

const PLACEMENTS: WidgetPlacement[] = ["before", "after"]

function splitZone(zone: string): { slot: string; placement: WidgetPlacement } {
  const lastDot = zone.lastIndexOf(".")
  if (lastDot === -1) {
    return { slot: zone, placement: "after" }
  }
  const maybePlacement = zone.slice(lastDot + 1) as WidgetPlacement
  if (PLACEMENTS.includes(maybePlacement)) {
    return { slot: zone.slice(0, lastDot), placement: maybePlacement }
  }
  return { slot: zone, placement: "after" }
}

/**
 * Per-panel singleton mirroring Medusa's `DashboardApp`. Built once at app root
 * from the aggregated `virtual:mercur/{widgets,navigation}` modules; the zone
 * hosts read from it via `useExtension()`.
 */
export class ExtensionRegistry {
  private widgets = new Map<string, ZoneWidgets>()
  private navOverrides: NavItemOverride[] = []
  private customFields: CustomFieldsConfig[] = []

  constructor(
    input: {
      widgets?: WidgetModule
      navigation?: NavigationModule
      customFields?: CustomFieldsModule
    } = {}
  ) {
    this.populateWidgets(input.widgets?.widgets ?? [])
    this.navOverrides = input.navigation?.items ?? []
    this.customFields = input.customFields?.configs ?? []
  }

  private ensureSlot(slot: string): ZoneWidgets {
    let entry = this.widgets.get(slot)
    if (!entry) {
      entry = { before: [], after: [] }
      this.widgets.set(slot, entry)
    }
    return entry
  }

  private populateWidgets(widgets: Widget[]): void {
    for (const widget of widgets) {
      const zones = Array.isArray(widget.zone) ? widget.zone : [widget.zone]
      for (const zone of zones) {
        const { slot, placement } = splitZone(zone)
        const entry = this.ensureSlot(slot)
        const resolved: ResolvedWidget = {
          Component: widget.Component,
          widgetId: widget.widgetId,
        }
        entry[placement].push(resolved)
      }
    }
  }

  getWidgets(slot: string): ZoneWidgets {
    return this.widgets.get(slot) ?? { before: [], after: [] }
  }

  getNavOverrides(): NavItemOverride[] {
    return this.navOverrides
  }

  private configsFor(model: string): CustomFieldsConfig[] {
    return this.customFields.filter((c) => c.model === model)
  }

  /** Distinct module links declared across a model's configs. */
  getLinks(model: string): string[] {
    const links = new Set<string>()
    for (const config of this.configsFor(model)) {
      const link = config.link
      if (!link) continue
      for (const l of Array.isArray(link) ? link : [link]) links.add(l)
    }
    return [...links]
  }

  /** Custom form fields for a model's form zone (and optional tab). */
  getFormFields(model: string, zone: string, tab?: string): ResolvedFormField[] {
    const out: ResolvedFormField[] = []
    for (const config of this.configsFor(model)) {
      for (const form of config.forms ?? []) {
        if (form.zone !== zone) continue
        if (form.tab && tab && form.tab !== tab) continue
        if (form.tab && !tab) continue
        for (const [name, field] of Object.entries(form.fields)) {
          out.push({ name, field })
        }
      }
    }
    return out
  }

  /** All custom form fields for a model, keyed for schema/default building. */
  getAllFormFields(model: string): ResolvedFormField[] {
    const out: ResolvedFormField[] = []
    const seen = new Set<string>()
    for (const config of this.configsFor(model)) {
      for (const form of config.forms ?? []) {
        for (const [name, field] of Object.entries(form.fields)) {
          if (seen.has(name)) continue
          seen.add(name)
          out.push({ name, field })
        }
      }
    }
    return out
  }

  /** Section display contributions (field add/replace/remove + actions). */
  getDisplays(model: string, zone: string): ResolvedDisplays {
    const fields: CustomDisplayField[] = []
    const actions: SectionAction[] = []
    for (const config of this.configsFor(model)) {
      for (const display of config.displays ?? []) {
        if (display.zone !== zone) continue
        if (display.fields) fields.push(...display.fields)
        if (display.actions) actions.push(...display.actions)
      }
    }
    actions.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    return { fields, actions }
  }

  /** Merged list-table extension for a model. */
  getListExtension(model: string): CustomListExtension {
    const merged: Required<CustomListExtension> = {
      columns: [],
      bulkActions: [],
      filters: [],
      viewDefaults: { columnVisibility: {}, columnOrder: [] },
    }
    for (const config of this.configsFor(model)) {
      const list = config.list
      if (!list) continue
      if (list.columns) merged.columns.push(...list.columns)
      if (list.bulkActions) merged.bulkActions.push(...list.bulkActions)
      if (list.filters) merged.filters.push(...list.filters)
      if (list.viewDefaults?.columnVisibility) {
        Object.assign(
          merged.viewDefaults.columnVisibility!,
          list.viewDefaults.columnVisibility
        )
      }
      if (list.viewDefaults?.columnOrder) {
        merged.viewDefaults.columnOrder = list.viewDefaults.columnOrder
      }
    }
    merged.bulkActions.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    return merged
  }
}
