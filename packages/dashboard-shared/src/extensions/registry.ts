import type { ComponentType, ReactNode } from "react"
import type {
  ActivityEntry,
  CustomColumn,
  CustomDisplayField,
  CustomFieldsConfig,
  CustomFormField,
  CustomListExtension,
  CustomListFilter,
  LayoutConfig,
  LayoutPreferences,
  NavGroupConfig,
  NavItemOverride,
  Permission,
  SectionAction,
  ZonePreference,
} from "@mercurjs/dashboard-sdk"
import { NAV_ZONES } from "@mercurjs/dashboard-sdk"
import { mergeLayoutPreferences, navOverridesFromPreferences } from "./preferences"

export type WidgetPlacement = "before" | "after"

export type Widget = {
  Component: ComponentType<{ data?: unknown; renderDefault?: () => ReactNode }>
  zone: string[]
  widgetId: string
  permission?: Permission[]
  label?: string
  section?: string
  order?: number
  replace?: string
}

export type WidgetModule = { widgets?: Widget[] }
export type NavigationModule = {
  groups?: NavGroupConfig[]
  items?: NavItemOverride<string>[]
}
export type CustomFieldsModule = { configs?: CustomFieldsConfig[] }
export type LayoutModule = { layouts?: LayoutConfig[] }
export type PreferenceModule = { layers?: LayoutPreferences[] }

export type ResolvedFormField = { name: string; field: CustomFormField }
type ResolvedFormEntry = {
  name: string
  field: CustomFormField | null
  zone: string
  tab?: string
}

/**
 * A config entry keyed by a built-in field id. `field: null` removes the
 * built-in; a field replaces it.
 */
export type FormFieldOverride = {
  overridden: boolean
  field: CustomFormField | null
}

export type OnboardingStep = {
  id: string
  label?: string
  rank: number
  optional: boolean
  custom: boolean
}

export type OnboardingStepDefault = {
  id: string
  rank: number
  optional: boolean
  /** Built-in steps that carry required data and can't be disabled. */
  required?: boolean
}
export type ResolvedDisplays = {
  fields: CustomDisplayField[]
  actions: SectionAction[]
}

type ResolvedWidget = {
  Component: Widget["Component"]
  widgetId: string
  permission?: Permission[]
  label?: string
}

export type ZoneWidgets = {
  before: ResolvedWidget[]
  after: ResolvedWidget[]
}

/** A widget resolved for a composer page, keyed by the section it lands in. */
export type SectionWidget = {
  Component: Widget["Component"]
  /** Entry id, `widget:<id>` */
  widgetId: string
  permission?: Permission[]
  order?: number
  replace?: string
}
export type SectionWidgetMap = Record<string, SectionWidget[]>

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
  private rawWidgets: Widget[] = []
  private navOverrides: NavItemOverride<string>[] = []
  private navGroups: NavGroupConfig[] = []
  private customFields: CustomFieldsConfig[] = []
  private layouts = new Map<string, LayoutConfig>()
  private preferences: LayoutPreferences = {}

  constructor(
    input: {
      widgets?: WidgetModule
      navigation?: NavigationModule
      customFields?: CustomFieldsModule
      layouts?: LayoutModule
      preferences?: PreferenceModule
    } = {}
  ) {
    this.rawWidgets = input.widgets?.widgets ?? []
    this.populateWidgets(this.rawWidgets)
    this.customFields = input.customFields?.configs ?? []
    for (const layout of input.layouts?.layouts ?? []) {
      this.layouts.set(layout.id, layout)
    }
    this.preferences = mergeLayoutPreferences(input.preferences?.layers ?? [])

    // `_navigation.ts` overrides first, then the sidebar zones of `_layouts.ts`
    // layered over them field by field.
    const nav = navOverridesFromPreferences(
      { items: input.navigation?.items ?? [], groups: input.navigation?.groups ?? [] },
      [this.preferences[NAV_ZONES.MAIN], this.preferences[NAV_ZONES.SETTINGS]]
    )
    this.navOverrides = nav.items
    this.navGroups = nav.groups
  }

  getLayout(id: string): LayoutConfig | undefined {
    return this.layouts.get(id)
  }

  registerLayouts(layouts: LayoutConfig[]): void {
    for (const layout of layouts) {
      if (!this.layouts.has(layout.id)) this.layouts.set(layout.id, layout)
    }
  }

  getLayoutPreference(zone: string): ZonePreference {
    return this.preferences[zone] ?? {}
  }

  /**
   * Widgets for a composer page, keyed by the layout section each lands in. A
   * zone is the page prefix (`product.details`) or a section under it
   * (`product.details.side`); the legacy `.before` / `.after` suffixes map to
   * the first and last order of that section. An explicit `section` wins.
   */
  getWidgetsForSections(prefix: string, sections: string[]): SectionWidgetMap {
    const result: SectionWidgetMap = {}
    const defaultSection = sections.includes("main") ? "main" : sections[0]
    const seen = new Map<string, number>()

    for (const widget of this.rawWidgets) {
      for (const zone of widget.zone) {
        if (zone !== prefix && !zone.startsWith(`${prefix}.`)) continue

        let suffix = zone === prefix ? "" : zone.slice(prefix.length + 1)
        let order = widget.order
        if (suffix === "before" || suffix.endsWith(".before")) {
          suffix = suffix.replace(/\.?before$/, "")
          order ??= Number.NEGATIVE_INFINITY
        } else if (suffix === "after" || suffix.endsWith(".after")) {
          suffix = suffix.replace(/\.?after$/, "")
          order ??= Number.POSITIVE_INFINITY
        }
        if (suffix && !sections.includes(suffix)) continue

        const section = widget.section ?? (suffix || defaultSection)
        if (!section) continue

        const base = `widget:${widget.widgetId}`
        const count = seen.get(base) ?? 0
        seen.set(base, count + 1)

        result[section] ??= []
        result[section].push({
          Component: widget.Component,
          widgetId: count === 0 ? base : `${base}#${count + 1}`,
          permission: widget.permission,
          order,
          replace: widget.replace,
        })
      }
    }

    return result
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
          permission: widget.permission,
          label: widget.label,
        }
        entry[placement].push(resolved)
      }
    }
  }

  getWidgets(slot: string): ZoneWidgets {
    return this.widgets.get(slot) ?? { before: [], after: [] }
  }

  getNavOverrides(): NavItemOverride<string>[] {
    return this.navOverrides
  }

  getNavGroups(): NavGroupConfig[] {
    return this.navGroups
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

  /** First lock reason a config returns for an action on this entity. */
  getActionLock(model: string, action: string, entity: unknown): string | undefined {
    for (const config of this.configsFor(model)) {
      const locks = config.actionLocks as
        | Record<string, ((entity: unknown) => string | undefined) | undefined>
        | undefined
      const reason = locks?.[action]?.(entity)
      if (reason) return reason
    }
    return undefined
  }

  getActivity(model: string, entity: unknown): ActivityEntry[] {
    return this.configsFor(model).flatMap((c) => c.activity?.(entity) ?? [])
  }

  // Configs are ordered plugins first, host app last. Entries are keyed so a
  // later config replaces an earlier one in place — including entries another
  // config added — instead of stacking a duplicate.
  private resolveFormFields(model: string): ResolvedFormEntry[] {
    const byName = new Map<string, ResolvedFormEntry>()
    for (const config of this.configsFor(model)) {
      for (const form of config.forms ?? []) {
        for (const [name, field] of Object.entries(form.fields ?? {})) {
          byName.set(name, { name, field, zone: form.zone, tab: form.tab })
        }
      }
    }
    return [...byName.values()]
  }

  // An entry without a tab belongs to every tab of its zone, unless the host
  // asks for `exactTab` (a data grid tab only takes fields aimed at it).
  private formEntriesFor(
    model: string,
    zone: string,
    tab?: string,
    exactTab = false
  ) {
    return this.resolveFormFields(model).filter((entry) => {
      if (entry.zone !== zone) return false
      if (!entry.tab) return !exactTab
      return !!tab && entry.tab === tab
    })
  }

  /**
   * Custom form fields added to a model's form zone (and optional tab). Entries
   * keyed by one of the host's `builtInFieldIds` are overrides, not additions,
   * and are read through `getFormFieldOverride` instead.
   */
  getFormFields(
    model: string,
    zone: string,
    tab?: string,
    builtInFieldIds: string[] = [],
    exactTab = false
  ): ResolvedFormField[] {
    const builtIns = new Set(builtInFieldIds)
    return this.formEntriesFor(model, zone, tab, exactTab).flatMap(({ name, field }) =>
      field && !builtIns.has(name) ? [{ name, field }] : []
    )
  }

  /** Replacement (or removal, `field: null`) of a built-in form field. */
  getFormFieldOverride(
    model: string,
    zone: string,
    id: string,
    tab?: string,
    exactTab = false
  ): FormFieldOverride {
    const entry = this.formEntriesFor(model, zone, tab, exactTab).find(
      (e) => e.name === id
    )
    return entry
      ? { overridden: true, field: entry.field }
      : { overridden: false, field: null }
  }

  /**
   * Resolves the onboarding wizard steps: built-ins merged with every
   * `zone: "onboarding"` form entry for the model. Later configs win per tab.
   */
  getOnboardingSteps(
    model: string,
    builtIns: OnboardingStepDefault[]
  ): OnboardingStep[] {
    const steps = new Map<string, OnboardingStep & { disabled?: boolean }>()
    for (const step of builtIns) {
      steps.set(step.id, {
        id: step.id,
        rank: step.rank,
        optional: step.optional,
        custom: false,
      })
    }

    const maxBuiltInRank = Math.max(0, ...builtIns.map((step) => step.rank))
    let nextCustomRank = maxBuiltInRank

    for (const config of this.configsFor(model)) {
      for (const form of config.forms ?? []) {
        if (form.zone !== "onboarding" || !form.tab) continue

        const existing = steps.get(form.tab)
        const builtIn = builtIns.find((step) => step.id === form.tab)

        if (form.disabled) {
          if (builtIn?.required) {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[mercur] The "${form.tab}" onboarding step can't be disabled.`
              )
            }
            continue
          }
          if (existing) existing.disabled = true
          continue
        }

        const step = existing ?? {
          id: form.tab,
          rank: (nextCustomRank += 1),
          optional: false,
          custom: true,
        }
        if (form.label !== undefined) step.label = form.label
        if (form.rank !== undefined) step.rank = form.rank
        if (form.optional !== undefined) step.optional = form.optional
        steps.set(form.tab, step)
      }
    }

    return [...steps.values()]
      .filter((step) => !step.disabled)
      .map(({ disabled: _disabled, ...step }) => step)
      .sort((a, b) => a.rank - b.rank)
  }

  /** All custom form fields for a model, keyed for schema/default building. */
  getAllFormFields(model: string): ResolvedFormField[] {
    return this.resolveFormFields(model).flatMap(({ name, field }) =>
      field ? [{ name, field }] : []
    )
  }

  /** Section display contributions (field add/replace/remove + actions). */
  getDisplays(model: string, zone: string): ResolvedDisplays {
    const fields = new Map<string, CustomDisplayField>()
    const actions: SectionAction[] = []
    for (const config of this.configsFor(model)) {
      for (const display of config.displays ?? []) {
        if (display.zone !== zone) continue
        for (const field of display.fields ?? []) fields.set(field.id, field)
        if (display.actions) actions.push(...display.actions)
      }
    }
    actions.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    return { fields: [...fields.values()], actions }
  }

  /**
   * Merged table extension for a model. `zone` picks the table: `"list"` is the
   * model's list page, and also matches `list` blocks that omit a zone.
   */
  getListExtension(model: string, zone = "list"): CustomListExtension {
    const columns = new Map<string, CustomColumn>()
    const filters = new Map<string, CustomListFilter>()
    const bulkActions: SectionAction[] = []
    const columnVisibility: Record<string, boolean> = {}
    let columnOrder: string[] = []

    const lists = this.configsFor(model).flatMap((config) =>
      config.list ? [config.list].flat() : []
    )
    for (const list of lists) {
      if ((list.zone ?? "list") !== zone) continue
      for (const column of list.columns ?? []) columns.set(column.id, column)
      for (const filter of list.filters ?? []) filters.set(filter.key, filter)
      if (list.bulkActions) bulkActions.push(...list.bulkActions)
      Object.assign(columnVisibility, list.viewDefaults?.columnVisibility)
      if (list.viewDefaults?.columnOrder) {
        columnOrder = list.viewDefaults.columnOrder
      }
    }
    bulkActions.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

    return {
      columns: [...columns.values()],
      bulkActions,
      filters: [...filters.values()],
      viewDefaults: { columnVisibility, columnOrder },
    }
  }
}
