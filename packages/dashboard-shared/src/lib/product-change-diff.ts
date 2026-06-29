import { ProductChangeActionDTO, ProductChangeActionType } from "@mercurjs/types"

export type ImageRef = { url: string }

export type MediaDiff = {
  added: ImageRef[]
  removed: ImageRef[]
}

export type FieldDiff = {
  field: string
  previous: unknown
  next: unknown
  variant_id?: string
}

export type AttributeChangeKind = "added" | "removed" | "updated"

export type AttributeChange = {
  kind: AttributeChangeKind
  /** Set for existing (catalog) attributes referenced by id. */
  attributeId?: string
  /** Set for inline attributes created in the same request (no id yet). */
  inlineTitle?: string
  /** Value ids to associate / add (select types or shared axis subset). */
  addValueIds: string[]
  /** New value names to create (inline / exclusive axis). */
  addValueNames: string[]
  /** Value ids removed (updates only). */
  removeValueIds: string[]
  /** Free-form scalar for text / unit / toggle attributes. */
  scalarValue?: string | number | boolean
}

export type VariantGroup = {
  variantId: string
  fieldDiffs: FieldDiff[]
  media: MediaDiff
}

export type ProductChangeView = {
  productUpdated: FieldDiff[]
  productMedia: MediaDiff
  attributes: AttributeChange[]
  variantsAdded: ProductChangeActionDTO[]
  variantsRemoved: ProductChangeActionDTO[]
  variantGroups: VariantGroup[]
  deleteRequested: boolean
}

export type ReferenceField =
  | "type_id"
  | "collection_id"
  | "categories"
  | "tags"

export const REFERENCE_FIELDS: ReferenceField[] = [
  "type_id",
  "collection_id",
  "categories",
  "tags",
]

const PRODUCT_FIELD_ORDER: Record<string, number> = {
  categories: 1,
  collection_id: 2,
  tags: 3,
  type_id: 4,
}

const sortProductFieldDiffs = (diffs: FieldDiff[]): FieldDiff[] =>
  diffs
    .map((diff, index) => ({ diff, index }))
    .sort((a, b) => {
      const weightA = PRODUCT_FIELD_ORDER[a.diff.field] ?? 0
      const weightB = PRODUCT_FIELD_ORDER[b.diff.field] ?? 0
      return weightA !== weightB ? weightA - weightB : a.index - b.index
    })
    .map(({ diff }) => diff)

export const isReferenceField = (field: string): field is ReferenceField =>
  (REFERENCE_FIELDS as string[]).includes(field)

/**
 * Variant fields that are not vendor-editable and must never surface in the
 * request block. The staging workflow already strips these, but older pending
 * changes may still carry them — keep the display defensive so non-editable
 * rows (e.g. `manage_inventory`) never render (MER-168).
 */
export const NON_EDITABLE_VARIANT_FIELDS = new Set(["manage_inventory"])

const MEDIA_FIELD = "images"

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

const normalizeImages = (value: unknown): ImageRef[] => {
  if (!Array.isArray(value)) return []
  const out: ImageRef[] = []
  for (const entry of value) {
    if (typeof entry === "string" && entry) {
      out.push({ url: entry })
    } else if (
      entry &&
      typeof entry === "object" &&
      "url" in entry &&
      typeof (entry as { url: unknown }).url === "string"
    ) {
      out.push({ url: (entry as { url: string }).url })
    }
  }
  return out
}

/** Split an `images` UPDATE (previous vs next arrays) into added / removed. */
const diffImages = (previous: unknown, next: unknown): MediaDiff => {
  const before = normalizeImages(previous)
  const after = normalizeImages(next)
  const beforeUrls = new Set(before.map((i) => i.url))
  const afterUrls = new Set(after.map((i) => i.url))
  return {
    added: after.filter((i) => !beforeUrls.has(i.url)),
    removed: before.filter((i) => !afterUrls.has(i.url)),
  }
}

/** A variant `images` field is staged as `{ add?: [], remove?: [] }`. */
const variantMedia = (value: unknown): MediaDiff => {
  if (!value || typeof value !== "object") return { added: [], removed: [] }
  const v = value as { add?: unknown; remove?: unknown }
  return {
    added: normalizeImages(v.add),
    removed: normalizeImages(v.remove),
  }
}

const hasMedia = (m: MediaDiff): boolean =>
  m.added.length > 0 || m.removed.length > 0

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

export type BooleanLabels = { true: string; false: string }

export const formatFieldValue = (
  value: unknown,
  field?: string,
  booleanLabels?: BooleanLabels
): string => {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "boolean") {
    const labels = booleanLabels ?? { true: "Yes", false: "No" }
    return value ? labels.true : labels.false
  }
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (field === "attribute_values" || field === "options") {
    const pretty = formatAttributeValues(value)
    if (pretty) return pretty
  }
  return JSON.stringify(value)
}

const toAttributeAdd = (details: Record<string, unknown>): AttributeChange => {
  const attribute = (details.attribute ?? {}) as Record<string, unknown>
  const id = typeof attribute.id === "string" ? attribute.id : undefined
  const title =
    typeof attribute.title === "string" ? attribute.title : undefined
  const valueIds = Array.isArray(attribute.value_ids)
    ? (attribute.value_ids as unknown[]).filter(
        (v): v is string => typeof v === "string"
      )
    : []
  const valueNames = Array.isArray(attribute.values)
    ? (attribute.values as unknown[]).filter(
        (v): v is string => typeof v === "string"
      )
    : []
  return {
    kind: "added",
    attributeId: id,
    inlineTitle: id ? undefined : title,
    addValueIds: valueIds,
    addValueNames: valueNames,
    removeValueIds: [],
    scalarValue: attribute.value as AttributeChange["scalarValue"],
  }
}

const toAttributeUpdate = (
  details: Record<string, unknown>
): AttributeChange | null => {
  const update = (details.update ?? {}) as Record<string, unknown>
  const id = typeof update.id === "string" ? update.id : undefined
  if (!id) return null
  const add = Array.isArray(update.add) ? (update.add as unknown[]) : []
  const addValueIds = add.filter((v): v is string => typeof v === "string")
  const addValueNames = add
    .filter(
      (v): v is { value: string } =>
        !!v &&
        typeof v === "object" &&
        typeof (v as { value?: unknown }).value === "string"
    )
    .map((v) => v.value)
  const removeValueIds = Array.isArray(update.remove)
    ? (update.remove as unknown[]).filter(
        (v): v is string => typeof v === "string"
      )
    : []
  return {
    kind: "updated",
    attributeId: id,
    inlineTitle: typeof update.title === "string" ? update.title : undefined,
    addValueIds,
    addValueNames,
    removeValueIds,
    scalarValue: update.value as AttributeChange["scalarValue"],
  }
}

export const buildProductChangeView = (
  actions: ProductChangeActionDTO[]
): ProductChangeView => {
  const productUpdated: FieldDiff[] = []
  let productMedia: MediaDiff = { added: [], removed: [] }
  const attributes: AttributeChange[] = []
  const variantsAdded: ProductChangeActionDTO[] = []
  const variantsRemoved: ProductChangeActionDTO[] = []
  const variantGroupMap = new Map<string, VariantGroup>()
  let deleteRequested = false

  const variantGroup = (variantId: string): VariantGroup => {
    let group = variantGroupMap.get(variantId)
    if (!group) {
      group = { variantId, fieldDiffs: [], media: { added: [], removed: [] } }
      variantGroupMap.set(variantId, group)
    }
    return group
  }

  for (const action of actions) {
    const details = action.details ?? {}

    switch (action.action) {
      case ProductChangeActionType.UPDATE: {
        const field = String(details.field ?? "—")
        if (field === MEDIA_FIELD) {
          const diff = diffImages(details.previous_value, details.value)
          productMedia = {
            added: [...productMedia.added, ...diff.added],
            removed: [...productMedia.removed, ...diff.removed],
          }
          break
        }
        productUpdated.push({
          field,
          previous: details.previous_value,
          next: details.value,
        })
        break
      }
      case ProductChangeActionType.STATUS_CHANGE: {
        productUpdated.push({
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
        const variantId =
          details.variant_id !== undefined && details.variant_id !== null
            ? String(details.variant_id)
            : undefined
        if (!variantId) break
        const group = variantGroup(variantId)
        for (const [field, value] of Object.entries(fields)) {
          if (NON_EDITABLE_VARIANT_FIELDS.has(field)) continue
          if (field === MEDIA_FIELD) {
            const media = variantMedia(value)
            group.media = {
              added: [...group.media.added, ...media.added],
              removed: [...group.media.removed, ...media.removed],
            }
            continue
          }
          group.fieldDiffs.push({
            field,
            previous: previousFields[field],
            next: value,
            variant_id: variantId,
          })
        }
        break
      }
      case ProductChangeActionType.VARIANT_ADD:
        variantsAdded.push(action)
        break
      case ProductChangeActionType.VARIANT_REMOVE:
        variantsRemoved.push(action)
        break
      case ProductChangeActionType.ATTRIBUTE_ADD:
        attributes.push(toAttributeAdd(details))
        break
      case ProductChangeActionType.ATTRIBUTE_REMOVE:
        attributes.push({
          kind: "removed",
          attributeId:
            typeof details.attribute_id === "string"
              ? details.attribute_id
              : undefined,
          addValueIds: [],
          addValueNames: [],
          removeValueIds: [],
        })
        break
      case ProductChangeActionType.ATTRIBUTE_UPDATE: {
        const change = toAttributeUpdate(details)
        if (change) attributes.push(change)
        break
      }
      case ProductChangeActionType.PRODUCT_DELETE:
        deleteRequested = true
        break
      case ProductChangeActionType.CHANGE_REQUESTED:
        // Audit-only signal — the operator's message lives on the parent
        // `ProductChange.external_note`, not in any diff bucket.
        break
    }
  }

  const variantGroups = Array.from(variantGroupMap.values()).filter(
    (g) => g.fieldDiffs.length > 0 || hasMedia(g.media)
  )

  return {
    productUpdated: sortProductFieldDiffs(productUpdated),
    productMedia,
    attributes,
    variantsAdded,
    variantsRemoved,
    variantGroups,
    deleteRequested,
  }
}

export const productChangeViewHasContent = (view: ProductChangeView): boolean =>
  view.productUpdated.length > 0 ||
  view.productMedia.added.length > 0 ||
  view.productMedia.removed.length > 0 ||
  view.attributes.length > 0 ||
  view.variantsAdded.length > 0 ||
  view.variantsRemoved.length > 0 ||
  view.variantGroups.length > 0 ||
  view.deleteRequested
