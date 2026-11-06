import { type UseQueryResult, useQueries } from "@tanstack/react-query"
import { useCallback, useMemo } from "react"

import { useExtension } from "./context"
import type { ExtensionRegistry } from "./registry"

export type BuiltInFieldScope = {
  model: string
  zone: string
  tab?: string
  /** Match only entries of `tab`, as data grids do. */
  exactTab?: boolean
}

export type BuiltInFieldDefaults = {
  /** Resolved defaults by built-in id; ids without a value are left out. */
  values: Record<string, unknown>
  /** Built-in ids whose override sets `hidden: true`. */
  hidden: Record<string, boolean>
  isLoading: boolean
}

export async function resolveBuiltInFieldDefault(
  extension: ExtensionRegistry,
  { model, zone, tab, exactTab }: BuiltInFieldScope,
  id: string
): Promise<unknown> {
  const { field } = extension.getFormFieldOverride(model, zone, id, tab, exactTab)
  if (!field || field.defaultValue === undefined) return undefined
  if (typeof field.defaultValue !== "function") return field.defaultValue
  try {
    return await (field.defaultValue as (data: unknown) => unknown)(undefined)
  } catch {
    return undefined
  }
}

/**
 * Resolves the `defaultValue` (sync or async) of `forms[].fields` overrides on
 * a form's built-in fields, so a `hidden` field still has a value to submit.
 */
export function useBuiltInFieldDefaults(
  scope: BuiltInFieldScope,
  ids: string[]
): BuiltInFieldDefaults {
  const extension = useExtension()
  const { model, zone, tab, exactTab } = scope
  const idsKey = ids.join(",")

  const overrides = useMemo(
    () =>
      (idsKey ? idsKey.split(",") : []).flatMap((id) => {
        const { field } = extension.getFormFieldOverride(
          model,
          zone,
          id,
          tab,
          exactTab
        )
        return field ? [{ id, field }] : []
      }),
    [extension, model, zone, tab, exactTab, idsKey]
  )

  const withDefault = useMemo(
    () => overrides.filter(({ field }) => field.defaultValue !== undefined),
    [overrides]
  )

  const combine = useCallback(
    (results: UseQueryResult<unknown>[]) => {
      const values: Record<string, unknown> = {}
      results.forEach((result, index) => {
        if (result.data !== undefined && result.data !== null) {
          values[withDefault[index].id] = result.data
        }
      })
      return { values, isLoading: results.some((r) => r.isPending) }
    },
    [withDefault]
  )

  const { values, isLoading } = useQueries({
    queries: withDefault.map(({ id }) => ({
      queryKey: ["extension-default", model, zone, tab ?? null, id],
      queryFn: async () =>
        (await resolveBuiltInFieldDefault(extension, scope, id)) ?? null,
      staleTime: Infinity,
      retry: false,
    })),
    combine,
  })

  const hidden = useMemo(
    () =>
      Object.fromEntries(
        overrides.filter(({ field }) => field.hidden).map(({ id }) => [id, true])
      ),
    [overrides]
  )

  return useMemo(
    () => ({ values, hidden, isLoading }),
    [values, hidden, isLoading]
  )
}
