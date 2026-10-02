import { useContext } from "react"
import { isPermitted } from "../permissions/permission-check"
import { PermissionsContext } from "../permissions/permissions-context"
import { useExtension } from "./context"
import type { Widget } from "./registry"

export type WidgetTab = {
  id: string
  label: string
  Component: Widget["Component"]
}

export type WidgetTabs = {
  before: WidgetTab[]
  after: WidgetTab[]
}

/**
 * Tab-bar host. Returns the widgets targeting a `*.tabs` slot as tabs to place
 * `before` and `after` the built-in ones. A widget without a `label` cannot be
 * shown as a tab and is left out.
 */
export const useWidgetTabs = (id: string): WidgetTabs => {
  const widgets = useExtension().getWidgets(id)
  const permissions = useContext(PermissionsContext)

  const toTabs = (placement: "before" | "after"): WidgetTab[] =>
    widgets[placement].flatMap(({ Component, widgetId, label, permission }) =>
      label && isPermitted(permissions, permission)
        ? [{ id: widgetId, label, Component }]
        : []
    )

  return { before: toTabs("before"), after: toTabs("after") }
}
