import { type ComponentType } from "react"
import { useExtension } from "./context"

export type DisplayExtensionZoneProps = {
  model: string
  zone: string
  data?: unknown
}

/**
 * Renders a model's ADDED section fields (those with a non-null component) plus
 * the section's custom `ActionMenu` contributions. Built-in sections consult
 * `useDisplayFieldOverride` to honor field replace/remove for existing fields.
 */
export const DisplayExtensionZone = ({
  model,
  zone,
  data,
}: DisplayExtensionZoneProps) => {
  const { fields, actions } = useExtension().getDisplays(model, zone)
  const added = fields.filter((f) => f.component)

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
