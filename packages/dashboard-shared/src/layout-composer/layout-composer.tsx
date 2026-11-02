import { Fragment, useContext, useMemo, type ReactNode } from "react"
import { Outlet } from "react-router-dom"
import type { Layouts, SectionNameFor, LayoutComponentProps } from "@mercurjs/dashboard-sdk"
import { useExtension } from "../extensions/context"
import { isPermitted } from "../permissions/permission-check"
import { PermissionsContext } from "../permissions/permissions-context"
import {
  applyReplacements,
  buildCoreEntries,
  buildDisplayEntries,
  buildWidgetEntries,
  extractSectionElements,
} from "./entries"
import { LayoutEntry } from "./entry"

export type LayoutComposerProps<TLayoutId extends Layouts, TData> = {
  /** Zone prefix widgets and preferences target, e.g. `product.details`. */
  widgetsZonePrefix: string
  /** Layout to render the page with, e.g. `core:two-column`. */
  preferredLayoutId: TLayoutId
  /** Content per section of that layout. */
  sections: Record<SectionNameFor<TLayoutId>, ReactNode>
  /** Passed to every widget as `data`. */
  data?: TData
  /** Render an `Outlet` after the layout for modal child routes. @default true */
  hasOutlet?: boolean
  /** Compose only the page's own entries; no widget is resolved for the prefix. */
  disableWidgets?: boolean
  layoutProps?: Omit<LayoutComponentProps, "sections" | "data">
  "data-testid"?: string
}

const LayoutComposerRoot = <TLayoutId extends Layouts, TData>({
  widgetsZonePrefix,
  preferredLayoutId,
  sections,
  data,
  hasOutlet = true,
  disableWidgets = false,
  layoutProps = {},
  "data-testid": testId,
}: LayoutComposerProps<TLayoutId, TData>) => {
  const registry = useExtension()
  const permissions = useContext(PermissionsContext)
  const layout = registry.getLayout(preferredLayoutId)

  const entriesBySection = useMemo(() => {
    const sectionIds = layout?.sections.map((section) => section.id) ?? []
    const validSections = new Set(sectionIds)
    const core = buildCoreEntries(extractSectionElements(sections as Record<string, ReactNode>))

    const widgets = disableWidgets
      ? {}
      : registry.getWidgetsForSections(widgetsZonePrefix, sectionIds)
    for (const section of Object.keys(widgets)) {
      widgets[section] = widgets[section].filter((widget) =>
        isPermitted(permissions, widget.permission)
      )
    }

    return buildDisplayEntries(
      applyReplacements(core, buildWidgetEntries(widgets)),
      registry.getLayoutPreference(widgetsZonePrefix),
      validSections
    )
  }, [sections, widgetsZonePrefix, layout, disableWidgets, registry, permissions])

  if (!layout) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[mercur] Unknown layout "${preferredLayoutId}".`)
    }
    return null
  }

  const rendered: Record<string, ReactNode> = {}
  for (const section of layout.sections) {
    rendered[section.id] = (entriesBySection[section.id] ?? [])
      .filter((entry) => !entry.hidden)
      .map((entry) => <Fragment key={entry.entryId}>{entry.render(data)}</Fragment>)
  }

  const LayoutComponent = layout.Component

  return (
    <div className="flex w-full flex-col gap-y-3" data-testid={testId}>
      <LayoutComponent sections={rendered} data={data} {...layoutProps} />
      {hasOutlet && <Outlet />}
    </div>
  )
}

export const LayoutComposer = Object.assign(LayoutComposerRoot, {
  Entry: LayoutEntry,
})
