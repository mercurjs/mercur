import { Query } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType } from "@mercurjs/types"

/**
 * SPEC-014 §D create-wrapper input. Two shapes:
 *   - existing: `{ id, value_ids?, value? }`
 *   - inline:   `{ title, type?, values?, value?, is_variant_axis? }`
 *
 * NOTE: this step currently resolves EXISTING references only (axis → native
 * option attach via the mirror; non-axis select / toggle → value links).
 * Inline-at-create (`title`) and free-form text/unit value creation are owed
 * (see SPEC-014 §D) — they round-trip through the batch engine today.
 */
export type ProductAttributeRefInput =
  | { id: string; value_ids?: string[]; value?: string | number | boolean }
  | {
      title: string
      type?: AttributeType
      values?: string[]
      value?: string | number | boolean
      is_variant_axis?: boolean
    }

export type PreparedAttributeOption =
  | { id: string; value_ids?: string[] }
  | { title: string; values: string[]; is_exclusive: boolean }

export type PreparedProductAttributes = {
  /** Native option input for the product's variant axes. */
  options: PreparedAttributeOption[]
  /** ProductAttributeValue ids to link to the product (non-axis selections). */
  non_axis_value_ids: string[]
}

const isExistingRef = (
  r: ProductAttributeRefInput,
): r is { id: string; value_ids?: string[]; value?: string | number | boolean } =>
  typeof (r as { id?: string }).id === "string"

type LoadedAttr = {
  id: string
  name: string
  type: AttributeType
  is_variant_axis?: boolean
  mirror_option?: { id?: string } | null
  values?: Array<{
    id: string
    name: string
    mirror_option_value?: { id?: string } | null
  }> | null
}

export const prepareCreateAttributesStepId =
  "mercur-prepare-create-attributes"

export const prepareCreateAttributesStep = createStep(
  prepareCreateAttributesStepId,
  async (
    input: { products: Array<{ attributes?: ProductAttributeRefInput[] }> },
    { container },
  ) => {
    const perProduct: PreparedProductAttributes[] = input.products.map(() => ({
      options: [],
      non_axis_value_ids: [],
    }))

    const existingIds = new Set<string>()
    for (const p of input.products) {
      for (const ref of p.attributes ?? []) {
        if (isExistingRef(ref)) existingIds.add(ref.id)
      }
    }

    if (!existingIds.size) {
      return new StepResponse(perProduct)
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: [
        "id",
        "name",
        "type",
        "is_variant_axis",
        "mirror_option.id",
        "values.id",
        "values.name",
        "values.mirror_option_value.id",
      ],
      filters: { id: Array.from(existingIds) },
    })
    const byId = new Map<string, LoadedAttr>(
      (data as LoadedAttr[]).map((a) => [a.id, a]),
    )

    input.products.forEach((p, idx) => {
      for (const ref of p.attributes ?? []) {
        if (!isExistingRef(ref)) continue // inline owed (§D)

        const attr = byId.get(ref.id)
        if (!attr) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Product attribute ${ref.id} not found`,
          )
        }

        const isAxis =
          attr.type === AttributeType.MULTI_SELECT && !!attr.is_variant_axis

        if (isAxis && attr.mirror_option?.id) {
          const mirrorByValueId = new Map(
            (attr.values ?? []).map((v) => [
              v.id,
              v.mirror_option_value?.id,
            ]),
          )
          const optionValueIds = (ref.value_ids ?? [])
            .map((vid) => mirrorByValueId.get(vid))
            .filter((id): id is string => !!id)
          perProduct[idx].options.push({
            id: attr.mirror_option.id,
            value_ids: optionValueIds.length ? optionValueIds : undefined,
          })
          continue
        }

        if (attr.type === AttributeType.TOGGLE) {
          const target = String(ref.value)
          const match = (attr.values ?? []).find((v) => v.name === target)
          if (match) perProduct[idx].non_axis_value_ids.push(match.id)
          continue
        }

        // non-axis select: explicit value ids
        for (const vid of ref.value_ids ?? []) {
          perProduct[idx].non_axis_value_ids.push(vid)
        }
        // non-axis text/unit referencing an EXISTING value by name
        if (ref.value !== undefined) {
          const match = (attr.values ?? []).find(
            (v) => v.name === String(ref.value),
          )
          if (match) perProduct[idx].non_axis_value_ids.push(match.id)
        }
      }
    })

    return new StepResponse(perProduct)
  },
)
