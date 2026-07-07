import { Fragment, type ReactNode } from "react"
import { useExtension } from "./context"

export type WidgetZoneProps = {
  /** Stable slot id, e.g. `product.list` or `product.detail`. Placement suffixes
   * (`before | after | replace`) are matched against it at render time. */
  id: string
  /** Optional data passed to each widget component (e.g. the detail entity). */
  data?: unknown
  /** The built-in content, rendered between `before` and `after` widgets. */
  children?: ReactNode
}

/**
 * Injection-zone host. Renders `before` widgets → the built-in child →
 * `after` widgets. A zone that no page renders as a host can never be targeted.
 */
export const WidgetZone = ({ id, data, children }: WidgetZoneProps) => {
  const { before, after } = useExtension().getWidgets(id)

  return (
    <Fragment>
      {before.map(({ Component, widgetId }) => (
        <Component key={`before-${widgetId}`} data={data} />
      ))}
      {children}
      {after.map(({ Component, widgetId }) => (
        <Component key={`after-${widgetId}`} data={data} />
      ))}
    </Fragment>
  )
}
