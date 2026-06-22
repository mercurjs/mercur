import type { ProductCreateSchemaType } from "../../types"

export type AttributeEntry = NonNullable<
  ProductCreateSchemaType["attributes"]
>[number]

export type RequiredAttributeInput = {
  id: string
  name: string
  type?: string
  is_variant_axis?: boolean
}

// Mirrors `AttributeType.MULTI_SELECT` from `@mercurjs/types`. Inlined (like
// the raw literals in the create schema's superRefine) so this module — and
// its unit test — stay free of the workspace barrel import.
const MULTI_SELECT = "multi_select"

const buildRequiredEntry = (attr: RequiredAttributeInput): AttributeEntry => ({
  attribute_id: attr.id,
  title: attr.name,
  values: attr.type === MULTI_SELECT ? ([] as string[]) : "",
  is_custom: false,
  is_required: true,
  use_for_variants: !!attr.is_variant_axis,
  type: attr.type,
})

/**
 * Order-preserving merge of category-required attributes into the current
 * attribute list.
 *
 * MER-183: the previous implementation rebuilt the array as
 * `[...nonRequired, ...required]`. Because `RequiredAttributes` re-runs on
 * every `useProductAttributes` refetch (e.g. refetch-on-window-focus), that
 * unconditionally reordered the `attributes` array under the live
 * `useFieldArray`. The snapshot (`fields`) then desynced from the live form
 * values, so custom-attribute rows rendered with the wrong toggle/value field
 * (a variant-axis attribute showing the informational textarea and vice
 * versa) and the entered values were wiped — all "without any interaction".
 *
 * This version keeps every existing entry in its original position so the
 * live values stay index-aligned with the field-array snapshot, and only
 * appends genuinely-new required attributes. It returns the SAME array
 * reference when nothing changed, so the caller can skip the `setValue` (and
 * the row remount) entirely on refetches that change nothing.
 */
export const mergeRequiredAttributes = (
  current: AttributeEntry[],
  productAttributes: RequiredAttributeInput[]
): AttributeEntry[] => {
  const requiredById = new Map(productAttributes.map((a) => [a.id, a]))
  const present = new Set<string>()
  let changed = false

  const next = current.map((entry) => {
    if (
      !entry.is_custom &&
      entry.attribute_id &&
      requiredById.has(entry.attribute_id)
    ) {
      present.add(entry.attribute_id)
      // Already in the form — preserve the user's values, just make sure the
      // required flag is set.
      if (!entry.is_required) {
        changed = true
        return { ...entry, is_required: true }
      }
    }
    return entry
  })

  for (const attr of productAttributes) {
    if (!present.has(attr.id)) {
      next.push(buildRequiredEntry(attr))
      changed = true
    }
  }

  return changed ? next : current
}

/**
 * Order-preserving application of the "add existing attributes" modal
 * selection.
 *
 * MER-183: the previous implementation rebuilt the array as
 * `[...selected, ...custom]`, which reordered it under the live
 * `useFieldArray` and tore the custom-attribute rows the same way the
 * required-attribute effect did.
 *
 * This version updates still-selected non-custom entries in place, drops
 * deselected ones, leaves custom entries untouched in their original
 * position, and appends newly-selected attributes (preserving the modal's
 * selection order).
 */
export const mergeSelectedAttributes = (
  current: AttributeEntry[],
  selected: AttributeEntry[]
): AttributeEntry[] => {
  const selectedById = new Map(
    selected
      .filter((a) => a.attribute_id)
      .map((a) => [a.attribute_id as string, a])
  )

  const next: AttributeEntry[] = []

  for (const entry of current) {
    if (entry.is_custom) {
      next.push(entry)
      continue
    }
    if (entry.attribute_id && selectedById.has(entry.attribute_id)) {
      next.push(selectedById.get(entry.attribute_id)!)
      selectedById.delete(entry.attribute_id)
    }
    // Non-custom + no longer selected => deselected => drop.
  }

  for (const attr of selected) {
    if (attr.attribute_id && selectedById.has(attr.attribute_id)) {
      next.push(attr)
      selectedById.delete(attr.attribute_id)
    }
  }

  return next
}
