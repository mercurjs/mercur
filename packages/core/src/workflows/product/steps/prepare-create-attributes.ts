import { Query } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType } from "@mercurjs/types"

/**
 * SPEC-014 unified create-wrapper attribute input. Two shapes:
 *   - existing: `{ id, value_ids?, value? }`
 *   - inline:   `{ title, type?, values?, value?, is_variant_axis? }`
 */
export type ProductAttributeRefInput =
  | { id: string; value_ids?: string[]; value?: string | number | boolean }
  | {
      title: string
      type?: AttributeType
      values?: string[]
      value?: string | number | boolean
      is_variant_axis?: boolean
      is_filterable?: boolean
      is_required?: boolean
      description?: string | null
      metadata?: Record<string, unknown> | null
    }

export type PreparedAttributeOption =
  | { id: string; value_ids?: string[] }
  | { title: string; values: string[]; is_exclusive: boolean }

export type PreparedInlineAttribute = {
  title: string
  type: AttributeType
  is_variant_axis: boolean
  values: string[]
  is_filterable?: boolean
  is_required?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type PreparedProductAttributes = {
  /** Native option input for the product's variant axes (existing + inline). */
  options: PreparedAttributeOption[]
  /** Existing ProductAttributeValue ids to link (non-axis selections). */
  non_axis_value_ids: string[]
  /** Free-form text/unit values to create on existing attributes, then link. */
  free_form: Array<{ attribute_id: string; names: string[] }>
  /** Inline (product-scoped) attributes to create post-stock. */
  inline: PreparedInlineAttribute[]
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
      free_form: [],
      inline: [],
    }))

    const existingIds = new Set<string>()
    for (const p of input.products) {
      for (const ref of p.attributes ?? []) {
        if (isExistingRef(ref)) existingIds.add(ref.id)
      }
    }

    let byId = new Map<string, LoadedAttr>()
    if (existingIds.size) {
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
      byId = new Map((data as LoadedAttr[]).map((a) => [a.id, a]))
    }

    input.products.forEach((p, idx) => {
      for (const ref of p.attributes ?? []) {
        if (!isExistingRef(ref)) {
          // inline (product-scoped) attribute
          const values =
            ref.values ??
            (ref.value !== undefined ? [String(ref.value)] : [])
          const isAxis =
            ref.type === AttributeType.MULTI_SELECT && !!ref.is_variant_axis
          if (isAxis && values.length) {
            perProduct[idx].options.push({
              title: ref.title,
              values,
              is_exclusive: true,
            })
          }
          perProduct[idx].inline.push({
            title: ref.title,
            type: ref.type ?? AttributeType.TEXT,
            is_variant_axis: !!ref.is_variant_axis,
            values,
            is_filterable: ref.is_filterable,
            is_required: ref.is_required,
            description: ref.description,
            metadata: ref.metadata,
          })
          continue
        }

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
            (attr.values ?? []).map((v) => [v.id, v.mirror_option_value?.id]),
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
          const match = (attr.values ?? []).find(
            (v) => v.name === String(ref.value),
          )
          if (match) perProduct[idx].non_axis_value_ids.push(match.id)
          continue
        }

        // non-axis select: explicit value ids
        for (const vid of ref.value_ids ?? []) {
          perProduct[idx].non_axis_value_ids.push(vid)
        }
        // text/unit: a `value` name — link if it exists, else create (free-form)
        if (ref.value !== undefined) {
          const name = String(ref.value)
          const match = (attr.values ?? []).find((v) => v.name === name)
          if (match) {
            perProduct[idx].non_axis_value_ids.push(match.id)
          } else {
            perProduct[idx].free_form.push({
              attribute_id: attr.id,
              names: [name],
            })
          }
        }
      }
    })

    return new StepResponse(perProduct)
  },
)
