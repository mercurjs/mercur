import {
  AttributeType,
  CreateProductAttributeValueDTO,
  ProductAttributeDTO,
  VariantAttributeBatchInput,
} from "@mercurjs/types"

import { SCALAR_VALUE_TYPES } from "../steps"

export type VariantAttributeJoinRow = {
  id: string
  variant_id: string
  value_id: string
  value?: { id: string; name: string; attribute_id: string } | null
}

export type VariantAttributeChangePlan = {
  deleteJoinIds: string[]
  deleteValueIds: string[]
  attachValueIds: string[]
  newValueRows: (CreateProductAttributeValueDTO & { attribute_id: string })[]
  renameValueRows: { id: string; name: string }[]
}

const SELECT_TYPES: AttributeType[] = [
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
]

/**
 * Turns one variant's remove → add → update batch into the row changes that apply it, given the
 * attributes it names and the join rows the variant currently holds.
 */
export const planVariantAttributeChanges = (
  input: Pick<VariantAttributeBatchInput, "add" | "remove" | "update">,
  attrsById: Map<string, ProductAttributeDTO>,
  current: VariantAttributeJoinRow[],
): VariantAttributeChangePlan => {
  const heldByAttr = new Map<
    string,
    { join_id: string; value_id: string; name: string }[]
  >()
  for (const row of current) {
    if (!row.value?.attribute_id) continue
    const attributeId = row.value.attribute_id
    const list = heldByAttr.get(attributeId) ?? []
    list.push({ join_id: row.id, value_id: row.value_id, name: row.value.name })
    heldByAttr.set(attributeId, list)
  }

  const deleteJoinIds = new Set<string>()
  const deleteValueIds = new Set<string>()
  const attachValueIds = new Set<string>()
  const newValueRows: VariantAttributeChangePlan["newValueRows"] = []
  const renameValueRows: VariantAttributeChangePlan["renameValueRows"] = []

  const detachAll = (attributeId: string, dropScalarRows: boolean) => {
    for (const held of heldByAttr.get(attributeId) ?? []) {
      deleteJoinIds.add(held.join_id)
      if (dropScalarRows) {
        deleteValueIds.add(held.value_id)
      }
    }
    heldByAttr.set(attributeId, [])
  }

  for (const attributeId of input.remove ?? []) {
    const attr = attrsById.get(attributeId)
    if (!attr) continue
    detachAll(attributeId, SCALAR_VALUE_TYPES.includes(attr.type))
  }

  const setSelection = (attributeId: string, desired: string[]) => {
    const held = heldByAttr.get(attributeId) ?? []
    const desiredSet = new Set(desired)
    for (const h of held) {
      if (!desiredSet.has(h.value_id)) {
        deleteJoinIds.add(h.join_id)
      }
    }
    const heldIds = new Set(held.map((h) => h.value_id))
    for (const id of desired) {
      if (!heldIds.has(id)) {
        attachValueIds.add(id)
      }
    }
    heldByAttr.set(
      attributeId,
      held
        .filter((h) => desiredSet.has(h.value_id))
        .concat(
          desired
            .filter((id) => !heldIds.has(id))
            .map((id) => ({ join_id: "", value_id: id, name: "" })),
        ),
    )
  }

  const applyScalar = (attr: ProductAttributeDTO, value: unknown) => {
    const name = String(value)
    const held = heldByAttr.get(attr.id) ?? []
    if (held.length > 0) {
      for (const h of held) {
        if (h.name !== name) {
          renameValueRows.push({ id: h.value_id, name })
        }
      }
      return
    }
    newValueRows.push({ name, attribute_id: attr.id })
  }

  const applyToggle = (attr: ProductAttributeDTO, value: unknown) => {
    const seeded = (attr.values ?? []).find((v) => v.name === String(value))
    setSelection(attr.id, seeded ? [seeded.id] : [])
  }

  for (const ref of input.add ?? []) {
    const attr = attrsById.get(ref.id)
    if (!attr) continue
    if (SELECT_TYPES.includes(attr.type)) {
      if (ref.value_ids) {
        const allowed = new Set((attr.values ?? []).map((v) => v.id))
        setSelection(
          attr.id,
          ref.value_ids.filter((id) => allowed.has(id)),
        )
      }
    } else if (attr.type === AttributeType.TOGGLE) {
      if (ref.value !== undefined) applyToggle(attr, ref.value)
    } else if (ref.value !== undefined) {
      applyScalar(attr, ref.value)
    }
  }

  for (const ref of input.update ?? []) {
    const attr = attrsById.get(ref.id)
    if (!attr) continue
    if (SELECT_TYPES.includes(attr.type)) {
      const allowed = new Set((attr.values ?? []).map((v) => v.id))
      const held = (heldByAttr.get(attr.id) ?? []).map((h) => h.value_id)
      let desired: string[] | undefined
      if (ref.value_ids) {
        desired = ref.value_ids
      } else if (ref.add || ref.remove) {
        const removeSet = new Set(ref.remove ?? [])
        const adds = (ref.add ?? []).filter(
          (a): a is string => typeof a === "string",
        )
        desired = Array.from(
          new Set([...held.filter((id) => !removeSet.has(id)), ...adds]),
        )
      }
      if (desired) {
        setSelection(
          attr.id,
          desired.filter((id) => allowed.has(id)),
        )
      }
    } else if (attr.type === AttributeType.TOGGLE) {
      if (ref.value !== undefined) applyToggle(attr, ref.value)
    } else if (ref.value !== undefined) {
      applyScalar(attr, ref.value)
    }
  }

  return {
    deleteJoinIds: Array.from(deleteJoinIds),
    deleteValueIds: Array.from(deleteValueIds),
    attachValueIds: Array.from(attachValueIds),
    newValueRows,
    renameValueRows,
  }
}
