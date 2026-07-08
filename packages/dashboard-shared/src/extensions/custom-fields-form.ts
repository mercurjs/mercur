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

/**
 * Build the `additional_data` zod object for a model's custom fields, to merge
 * into a form's base schema. Custom-field values live under `additional_data`
 * so the built-in create/edit validators never see them.
 */
export function buildAdditionalDataSchema(
  registry: ExtensionRegistry,
  model: string,
  zone?: string,
  tab?: string
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}
  const fields = zone
    ? registry.getFormFields(model, zone, tab)
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
  tab?: string
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}
  const fields = zone
    ? registry.getFormFields(model, zone, tab)
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
