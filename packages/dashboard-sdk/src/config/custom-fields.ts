import type { ComponentType } from "react"

/**
 * Minimal structural stand-in for a Zod schema, so the SDK stays free of a zod
 * dependency. `createFormHelper` (in `@mercurjs/dashboard-shared`) produces real
 * zod schemas that satisfy this shape.
 */
export type FieldValidation = {
    safeParse?: (value: unknown) => unknown
    parse?: (value: unknown) => unknown
    def?: { type?: string }
    _def?: unknown
}

/**
 * Per-model registry seeded by each panel's generated `extension-targets.d.ts`
 * and extendable by hand. Shapes the typed form/display zones per model.
 *
 * @example
 * declare module "@mercurjs/dashboard-sdk" {
 *   interface CustomFieldsRegistry {
 *     product: {
 *       formZones: "create" | "edit" | "organize" | "attributes"
 *       formTabs: { create: "general" | "organize"; edit: never }
 *       displayZones: "general" | "organize"
 *     }
 *   }
 * }
 */
export interface CustomFieldsRegistry {}

type DefaultModelShape = {
  formZones: string
  formTabs: Record<string, string>
  displayZones: string
  displayFieldIds: string
}

export type CustomFieldModel = keyof CustomFieldsRegistry extends never
  ? string
  : keyof CustomFieldsRegistry

type ModelShape<TModel> = TModel extends keyof CustomFieldsRegistry
  ? CustomFieldsRegistry[TModel] & DefaultModelShape
  : DefaultModelShape

export type CustomFormField<TData = unknown> = {
  /** Zod schema — drives the input type and validation. */
  validation: FieldValidation
  /** Static default or a resolver from the loaded entity. */
  defaultValue?: ((data: TData) => unknown) | unknown
  label?: string
  description?: string
  placeholder?: string
  /** Custom render component; falls back to a default input for the type. */
  component?: ComponentType
}

export type CustomFormZone<TModel> = ModelShape<TModel>["formZones"]

/**
 * Valid tab ids for a model's form zone. Narrows to the scanned union when the
 * zone has tabbed forms; falls back to `string` for zones without tabs (e.g.
 * onboarding steps) and for unknown models.
 */
export type CustomFormTab<TModel, TZone> =
  TZone extends keyof ModelShape<TModel>["formTabs"]
    ? ModelShape<TModel>["formTabs"][TZone]
    : string

export type CustomFormEntry<TModel> =
  CustomFormZone<TModel> extends infer TZone
    ? TZone extends CustomFormZone<TModel>
      ? {
          zone: TZone
          /** TabbedForm tab id, or onboarding wizard step id for `zone: "onboarding"`. */
          tab?: CustomFormTab<TModel, TZone>
          fields: Record<string, CustomFormField>
        }
      : never
    : never

/**
 * ADD (unknown id + component), REPLACE (built-in id + component), or REMOVE
 * (built-in id + `component: null`) a section field. Built-in ids autocomplete
 * from the model's generated `displayFieldIds`; any other string adds a new row.
 */
export type CustomDisplayField<TModel = unknown> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  id: ModelShape<TModel>["displayFieldIds"] | (string & {})
  component: ComponentType<{ data?: unknown }> | null
}

/** Same `{ rank?, component }` shape as list bulk actions. */
export type SectionAction = {
  rank?: number
  component: ComponentType<{ data?: unknown }>
}

export type CustomDisplayEntry<TModel> = {
  zone: ModelShape<TModel>["displayZones"]
  fields?: CustomDisplayField<TModel>[]
  actions?: SectionAction[]
}

export type CustomColumn = {
  id: string
  header?: string
  component?: ComponentType<{ row?: unknown; value?: unknown }>
}

export type CustomListExtension = {
  columns?: CustomColumn[]
  bulkActions?: SectionAction[]
  filters?: unknown[]
  viewDefaults?: {
    columnVisibility?: Record<string, boolean>
    columnOrder?: string[]
  }
}

export interface CustomFieldsConfig<TModel extends CustomFieldModel = CustomFieldModel> {
  model: TModel
  /** Module link(s) fetched alongside the entity (e.g. `brand`). */
  link?: string | string[]
  list?: CustomListExtension
  forms?: CustomFormEntry<TModel>[]
  displays?: CustomDisplayEntry<TModel>[]
}
