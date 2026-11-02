import { z } from "zod"
import type { CustomFormField } from "@mercurjs/dashboard-sdk"
import type { ExtensionRegistry } from "./registry"

/**
 * Zod-backed form surface (mirrors Medusa's `createFormHelper`, no `unstable_`).
 * Lives here rather than in `@mercurjs/dashboard-sdk` because the SDK is a
 * zod-free build-time package; re-exported from `@mercurjs/dashboard-sdk` for
 * authoring parity is a docs concern only.
 */
export function createFormHelper<TData>() {
  return {
    define: (field: CustomFormField<TData>): CustomFormField<TData> => field,
    string: () => z.string(),
    number: () => z.number(),
    boolean: () => z.boolean(),
    date: () => z.date(),
    array: z.array,
    object: z.object,
    null: () => z.null(),
    nullable: z.nullable,
    coerce: z.coerce,
  }
}

export type FormFieldInputType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"

// Zod wrappers that carry the base schema on `def.innerType` — unwrap them so an
// `optional()`/`nullable()`/`default()` field maps to its underlying control.
const ZOD_WRAPPER_TYPES = new Set([
  "optional",
  "nullable",
  "default",
  "prefault",
  "nonoptional",
  "readonly",
  "catch",
])

type ZodDef = { type?: string; innerType?: { def?: ZodDef } }

/** Input kind for a custom field: its explicit `type`, else its zod type. */
export function resolveFormFieldType(field: CustomFormField): FormFieldInputType {
  if (field.type) return field.type

  let def = (field.validation as unknown as { def?: ZodDef })?.def
  while (def && ZOD_WRAPPER_TYPES.has(def.type ?? "")) {
    def = def.innerType?.def
  }

  switch (def?.type) {
    case "boolean":
    case "number":
      return def.type
    case "string":
      return "text"
    default:
      return "textarea"
  }
}

/**
 * Build the `additional_data` zod object for a model's custom fields, to merge
 * into a form's base schema. Custom-field values live under `additional_data`
 * so the built-in create/edit validators never see them.
 */
export function buildAdditionalDataSchema(
  registry: ExtensionRegistry,
  model: string,
  zone?: string,
  tab?: string,
  builtInFieldIds?: string[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const fields = zone
    ? registry.getFormFields(model, zone, tab, builtInFieldIds)
    : registry.getAllFormFields(model)
  for (const { name, field } of fields) {
    shape[name] = field.validation as unknown as z.ZodTypeAny
  }
  return z.object(shape)
}

/** Resolve default values for a model's custom fields from the loaded entity. */
export function buildAdditionalDataDefaults(
  registry: ExtensionRegistry,
  model: string,
  data?: unknown,
  zone?: string,
  tab?: string,
  builtInFieldIds?: string[]
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  const fields = zone
    ? registry.getFormFields(model, zone, tab, builtInFieldIds)
    : registry.getAllFormFields(model)
  for (const { name, field } of fields) {
    if (typeof field.defaultValue === "function") {
      defaults[name] = (field.defaultValue as (d: unknown) => unknown)(data)
    } else if (field.defaultValue !== undefined) {
      defaults[name] = field.defaultValue
    }
  }
  return defaults
}

export type AdditionalDataScope = {
  model: string
  zone: string
  /**
   * Tabs whose fields land in this form state. Untabbed fields of the zone are
   * included unless `exactTab` is set.
   */
  tabs?: string[]
  exactTab?: boolean
  builtInFieldIds?: string[]
}

/**
 * `additional_data` schema and defaults for the fields of a zone's tabs. A
 * tabbed form passes its regular tabs; a data-grid tab passes `[tab]` with
 * `exactTab`, so the result describes one row.
 */
export function buildScopedAdditionalData(
  registry: ExtensionRegistry,
  { model, zone, tabs, exactTab, builtInFieldIds }: AdditionalDataScope,
  data?: unknown
): {
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
  defaults: Record<string, unknown>
} {
  const fields = new Map<string, CustomFormField>()
  for (const tab of tabs?.length ? tabs : [undefined]) {
    for (const { name, field } of registry.getFormFields(
      model,
      zone,
      tab,
      builtInFieldIds,
      exactTab
    )) {
      fields.set(name, field)
    }
  }

  const shape: Record<string, z.ZodTypeAny> = {}
  const defaults: Record<string, unknown> = {}
  for (const [name, field] of fields) {
    shape[name] = field.validation as unknown as z.ZodTypeAny
    if (typeof field.defaultValue === "function") {
      defaults[name] = (field.defaultValue as (d: unknown) => unknown)(data)
    } else if (field.defaultValue !== undefined) {
      defaults[name] = field.defaultValue
    }
  }
  return { schema: z.object(shape), defaults }
}

type AdditionalDataRows = {
  /** Form key of the row array (e.g. `variants`). */
  path: string
  schema: z.ZodObject<Record<string, z.ZodTypeAny>>
  /** Rows that are submitted; others skip validation. */
  include?: (row: Record<string, unknown>) => boolean
}

/**
 * Validates custom fields on top of a base schema that can't be extended (a
 * refined object). Errors land on `additional_data.<field>` and
 * `<rows.path>.<i>.additional_data.<field>`, so form fields and grid cells
 * show them in place.
 */
export function refineAdditionalData<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  {
    additionalData,
    rows,
  }: {
    additionalData?: z.ZodObject<Record<string, z.ZodTypeAny>>
    rows?: AdditionalDataRows
  }
): TSchema {
  const hasFields = (s?: z.ZodObject<Record<string, z.ZodTypeAny>>) =>
    !!s && Object.keys(s.shape).length > 0
  if (!hasFields(additionalData) && !hasFields(rows?.schema)) return schema

  return schema.superRefine((value, ctx) => {
    const report = (
      target: z.ZodObject<Record<string, z.ZodTypeAny>>,
      data: unknown,
      prefix: (string | number)[]
    ) => {
      const result = target.safeParse(data ?? {})
      if (result.success) return
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: "custom",
          message: issue.message,
          path: [...prefix, ...issue.path.map((p) => p as string | number)],
        })
      }
    }

    const values = value as Record<string, unknown>
    if (additionalData && hasFields(additionalData)) {
      report(additionalData, values.additional_data, ["additional_data"])
    }
    if (rows && hasFields(rows.schema)) {
      const list = (values[rows.path] ?? []) as Record<string, unknown>[]
      list.forEach((row, index) => {
        if (rows.include && !rows.include(row)) return
        report(rows.schema, row.additional_data, [
          rows.path,
          index,
          "additional_data",
        ])
      })
    }
  }) as TSchema
}
