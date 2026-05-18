import {
  ProductChangeActionDTO,
  ProductChangeActionType,
} from "@mercurjs/types"

export type FieldDiff = {
  field: string
  previous: unknown
  next: unknown
}

export type ProductChangePartition = {
  updated: FieldDiff[]
  added: ProductChangeActionDTO[]
  removed: ProductChangeActionDTO[]
  deleteRequested: boolean
}

export type ReferenceField =
  | "brand_id"
  | "type_id"
  | "collection_id"
  | "categories"
  | "tags"

export const REFERENCE_FIELDS: ReferenceField[] = [
  "brand_id",
  "type_id",
  "collection_id",
  "categories",
  "tags",
]

export const isReferenceField = (field: string): field is ReferenceField =>
  (REFERENCE_FIELDS as string[]).includes(field)

export const isImageList = (value: unknown): value is { url: string }[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "url" in entry &&
      typeof (entry as { url: unknown }).url === "string"
  )

export const extractReferenceIds = (
  field: ReferenceField,
  value: unknown
): string[] => {
  if (value === null || value === undefined || value === "") return []

  if (field === "categories" || field === "tags") {
    if (!Array.isArray(value)) return []
    return value
      .map((entry) =>
        typeof entry === "string"
          ? entry
          : typeof entry === "object" && entry !== null && "id" in entry
            ? String((entry as { id: unknown }).id ?? "")
            : ""
      )
      .filter(Boolean)
  }

  return typeof value === "string" ? [value] : []
}

export const humanizeFieldName = (field: string): string =>
  field
    .replace(/_ids$/i, "")
    .replace(/_id$/i, "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part, idx) =>
      idx === 0
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part.toLowerCase()
    )
    .join(" ")

const formatAttributeValues = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : null
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (!entries.length) return null
    return entries
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join(", ")
  }
  return null
}

export const formatFieldValue = (value: unknown, field?: string): string => {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "boolean") return value ? "True" : "False"
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (field === "attribute_values") {
    const pretty = formatAttributeValues(value)
    if (pretty) return pretty
  }
  return JSON.stringify(value)
}

export const partitionProductChangeActions = (
  actions: ProductChangeActionDTO[]
): ProductChangePartition => {
  const updated: FieldDiff[] = []
  const added: ProductChangeActionDTO[] = []
  const removed: ProductChangeActionDTO[] = []
  let deleteRequested = false

  for (const action of actions) {
    const details = action.details ?? {}

    switch (action.action) {
      case ProductChangeActionType.UPDATE: {
        updated.push({
          field: String(details.field ?? "—"),
          previous: details.previous_value,
          next: details.value,
        })
        break
      }
      case ProductChangeActionType.STATUS_CHANGE: {
        updated.push({
          field: "status",
          previous: details.previous_status,
          next: details.status,
        })
        break
      }
      case ProductChangeActionType.VARIANT_UPDATE: {
        const fields = (details.fields ?? {}) as Record<string, unknown>
        const previousFields = (details.previous_fields ?? {}) as Record<
          string,
          unknown
        >
        for (const [field, value] of Object.entries(fields)) {
          updated.push({
            field,
            previous: previousFields[field],
            next: value,
          })
        }
        break
      }
      case ProductChangeActionType.VARIANT_ADD:
      case ProductChangeActionType.ATTRIBUTE_ADD:
        added.push(action)
        break
      case ProductChangeActionType.VARIANT_REMOVE:
      case ProductChangeActionType.ATTRIBUTE_REMOVE:
        removed.push(action)
        break
      case ProductChangeActionType.PRODUCT_DELETE:
        deleteRequested = true
        break
    }
  }

  return { updated, added, removed, deleteRequested }
}

export const describeProductChangeAction = (
  action: ProductChangeActionDTO,
  fallbacks: { variant: string }
): string => {
  const details = action.details ?? {}
  switch (action.action) {
    case ProductChangeActionType.VARIANT_ADD: {
      const variant = (details.variant ?? {}) as {
        title?: string
        sku?: string
      }
      return variant.title || variant.sku || fallbacks.variant
    }
    case ProductChangeActionType.VARIANT_REMOVE:
      return String(details.variant_id ?? "")
    case ProductChangeActionType.ATTRIBUTE_ADD:
    case ProductChangeActionType.ATTRIBUTE_REMOVE:
      return String(details.attribute_id ?? "")
    default:
      return ""
  }
}
