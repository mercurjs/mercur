import { Fragment, type ComponentType, type ReactNode } from "react"
import { useExtension } from "./context"

export type DisplayExtensionZoneProps = {
  model: string
  zone: string
  data?: unknown
  /**
   * Ids of the section's built-in fields — those are overridden inline by
   * `<DisplayField>`, so the zone skips them and only renders genuinely added
   * fields (unknown ids). Defaults to none.
   */
  builtInFieldIds?: string[]
}

/**
 * Renders a model's ADDED section fields (non-null component, id not a built-in
 * field) plus the section's custom `ActionMenu` contributions. Built-in fields
 * are overridden in place by `<DisplayField>` / `useDisplayFieldOverride`.
 */
export const DisplayExtensionZone = ({
  model,
  zone,
  data,
  builtInFieldIds = [],
}: DisplayExtensionZoneProps) => {
  const { fields, actions } = useExtension().getDisplays(model, zone)
  const builtIn = new Set(builtInFieldIds)
  const added = fields.filter((f) => f.component && !builtIn.has(f.id))

  if (added.length === 0 && actions.length === 0) return null

  return (
    <>
      {added.map(({ id, component: Component }) => {
        const C = Component as ComponentType<{ data?: unknown }>
        return <C key={id} data={data} />
      })}
      {actions.map(({ component: Component }, i) => {
        const C = Component as ComponentType<{ data?: unknown }>
        return <C key={`action-${i}`} data={data} />
      })}
    </>
  )
}

export type DisplayFieldProps = {
  model: string
  zone: string
  /** Stable id of this built-in field (e.g. `title`, `description`). */
  id: string
  data?: unknown
  /** The built-in default rendering, shown when there is no override. */
  children?: ReactNode
}

/**
 * Wraps a single built-in detail field so a `displays[].fields` entry can
 * override its render (a different `component`) or remove it (`component: null`).
 * With no matching override, renders the built-in `children` unchanged. This is
 * the host the panel codegen scans to type `displayFieldIds`.
 */
export const DisplayField = ({
  model,
  zone,
  id,
  data,
  children,
}: DisplayFieldProps) => {
  const { overridden, Component } = useDisplayFieldOverride(model, zone, id)
  if (overridden) {
    return Component ? <Component data={data} /> : null
  }
  return <Fragment>{children}</Fragment>
}

export type DisplaySectionField = {
  /** Stable id of the built-in field (matches a `displays[].fields[].id`). */
  id: string
  /** The built-in default rendering (e.g. a `<SectionRow />`). */
  render: ReactNode
}

export type DisplaySectionProps = {
  model: string
  zone: string
  data?: unknown
  /** Built-in fields of this section, each overridable/removable by id. */
  fields: DisplaySectionField[]
}

/**
 * One-line helper for a row-style detail section: renders each built-in field
 * through `<DisplayField>` (so `displays[].fields` can replace/remove it) and
 * appends the section's added fields + actions via `<DisplayExtensionZone>`,
 * deriving `builtInFieldIds` from `fields`.
 */
export const DisplaySection = ({
  model,
  zone,
  data,
  fields,
}: DisplaySectionProps) => (
  <>
    {fields.map(({ id, render }) => (
      <DisplayField key={id} model={model} zone={zone} id={id} data={data}>
        {render}
      </DisplayField>
    ))}
    <DisplayExtensionZone
      model={model}
      zone={zone}
      data={data}
      builtInFieldIds={fields.map((f) => f.id)}
    />
  </>
)

/**
 * For a built-in detail section to honor a `displays[].fields` override of one
 * of its own fields: returns `{ overridden, Component }`. `overridden && !
 * Component` means remove (render nothing); `Component` means replace.
 */
export function useDisplayFieldOverride(
  model: string,
  zone: string,
  id: string
): { overridden: boolean; Component: ComponentType<{ data?: unknown }> | null } {
  const { fields } = useExtension().getDisplays(model, zone)
  const match = fields.find((f) => f.id === id)
  if (!match) return { overridden: false, Component: null }
  return {
    overridden: true,
    Component: (match.component as ComponentType<{ data?: unknown }>) ?? null,
  }
}
