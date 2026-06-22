import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  AttributeType,
  MercurModules,
  ProductAttributeInputDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

/**
 * UI-facing attribute reference, as accepted by the create + update
 * product wrappers. Two shapes:
 *
 *   1. **Existing reference** — `{ attribute_id, value_ids?, values? }`.
 *      Points at a pre-created `ProductAttribute`. `value_ids` are
 *      `ProductAttributeValue` ids; `values` are value names looked up
 *      against the attribute (only meaningful for text/unit/toggle).
 *
 *   2. **Inline custom** — `{ name, type, values, is_variant_axis? }`.
 *      Materialised by the wrapper as a product-scoped
 *      `ProductAttribute` (`product_id` FK pinned to the product being
 *      mutated).
 */
export type AttributeRef = ProductAttributeInputDTO

export const isExistingRef = (
  r: AttributeRef,
): r is Extract<AttributeRef, { attribute_id: string }> =>
  (r as { attribute_id?: string }).attribute_id !== undefined

export const isInlineRef = (
  r: AttributeRef,
): r is Extract<AttributeRef, { name: string }> =>
  (r as { name?: string }).name !== undefined

export type ResolvedExistingRef = {
  attribute_id: string
  attribute_name: string
  attribute_type: AttributeType
  is_variant_axis: boolean
  value_ids: string[]
  value_names: string[]
}

export type ResolvedInlineRef = {
  name: string
  type: AttributeType
  is_variant_axis: boolean
  values: string[]
  is_filterable?: boolean
  is_required?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type ResolvedRefs = {
  existing_variant: ResolvedExistingRef[]
  inline_variant: ResolvedInlineRef[]
  existing_product: ResolvedExistingRef[]
  inline_product: ResolvedInlineRef[]
}

/**
 * Input is a list of *groups* (one per product on the create wrapper,
 * one in total on the update wrapper). Each group carries the raw
 * `variant_attributes` / `product_attributes` arrays from the wrapper
 * payload. The step:
 *
 *   - looks up every existing `attribute_id` once (single batched
 *     `listProductAttributes` call) so the workflow transforms can
 *     synthesise stock `options[]` from real attribute + value names;
 *   - resolves `values` (names) → `value_ids` for refs that didn't
 *     pre-resolve ids (text/unit/toggle attributes);
 *   - splits inline refs from existing refs and normalises their shape.
 *
 * Read-only — no compensation.
 */
export type ResolveAttributeRefsInput = {
  groups: {
    variant_attributes?: AttributeRef[]
    product_attributes?: AttributeRef[]
  }[]
}

export const resolveAttributeRefsStepId = "mercur-resolve-attribute-refs"

export const resolveAttributeRefsStep = createStep(
  resolveAttributeRefsStepId,
  async (input: ResolveAttributeRefsInput, { container }) => {
    const attributeIds = new Set<string>()
    for (const g of input.groups) {
      for (const r of [
        ...(g.variant_attributes ?? []),
        ...(g.product_attributes ?? []),
      ]) {
        if (isExistingRef(r)) attributeIds.add(r.attribute_id)
      }
    }

    let attrsById = new Map<
      string,
      {
        id: string
        name: string
        type: AttributeType
        is_variant_axis: boolean
        values: { id: string; name: string }[]
      }
    >()
    if (attributeIds.size) {
      const service = container.resolve<ProductAttributeModuleService>(
        MercurModules.PRODUCT_ATTRIBUTE,
      )
      const attrs = await service.listProductAttributes(
        { id: Array.from(attributeIds) },
        {
          relations: ["values"],
          select: ["id", "name", "type", "is_variant_axis"],
        },
      )
      attrsById = new Map(
        attrs.map((a) => [
          a.id,
          {
            id: a.id,
            name: a.name,
            type: a.type as AttributeType,
            is_variant_axis: !!a.is_variant_axis,
            values: (a.values ?? []).map((v) => ({ id: v.id, name: v.name })),
          },
        ]),
      )
    }

    const resolveExisting = (
      ref: Extract<AttributeRef, { attribute_id: string }>,
    ): ResolvedExistingRef => {
      const attr = attrsById.get(ref.attribute_id)
      if (!attr) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product attribute ${ref.attribute_id} not found`,
        )
      }

      const idToName = new Map(attr.values.map((v) => [v.id, v.name]))
      const nameToId = new Map(attr.values.map((v) => [v.name, v.id]))

      const value_ids: string[] = []
      const value_names: string[] = []

      for (const id of ref.value_ids ?? []) {
        const name = idToName.get(id)
        if (!name) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Product attribute value ${id} not found on attribute ${ref.attribute_id}`,
          )
        }
        value_ids.push(id)
        value_names.push(name)
      }
      for (const name of ref.values ?? []) {
        const id = nameToId.get(name)
        // Select-type values must already exist; text/unit values are
        // free-form and resolved elsewhere — skip silently here.
        if (!id) continue
        if (!value_ids.includes(id)) {
          value_ids.push(id)
          value_names.push(name)
        }
      }

      return {
        attribute_id: ref.attribute_id,
        attribute_name: attr.name,
        attribute_type: attr.type,
        is_variant_axis: attr.is_variant_axis,
        value_ids,
        value_names,
      }
    }

    const perGroup: ResolvedRefs[] = input.groups.map((g) => {
      const out: ResolvedRefs = {
        existing_variant: [],
        inline_variant: [],
        existing_product: [],
        inline_product: [],
      }

      for (const r of g.variant_attributes ?? []) {
        if (isExistingRef(r)) out.existing_variant.push(resolveExisting(r))
        else if (isInlineRef(r))
          out.inline_variant.push({
            name: r.name,
            type: r.type,
            is_variant_axis: true,
            values: r.values ?? [],
            is_filterable: r.is_filterable,
            is_required: r.is_required,
            description: r.description,
            metadata: r.metadata,
          })
      }
      for (const r of g.product_attributes ?? []) {
        if (isExistingRef(r)) out.existing_product.push(resolveExisting(r))
        else if (isInlineRef(r))
          out.inline_product.push({
            name: r.name,
            type: r.type,
            is_variant_axis: r.is_variant_axis ?? false,
            values: r.values ?? [],
            is_filterable: r.is_filterable,
            is_required: r.is_required,
            description: r.description,
            metadata: r.metadata,
          })
      }
      return out
    })

    return new StepResponse(perGroup)
  },
)

/**
 * Flat plan entry describing one inline-custom attribute to materialise.
 * Carries enough context to (a) feed
 * `createProductAttributesStep` and (b) slice the returned values back
 * into per-product link rows.
 */
export type InlinePlanEntry = {
  name: string
  type: AttributeType
  is_variant_axis: boolean
  is_filterable: boolean
  is_required: boolean
  description: string | null
  metadata: Record<string, unknown> | null
  product_id: string
  /** Internal: index into the surrounding groups array. */
  _group_idx: number
  /** Internal: value names to materialise once the attribute exists. */
  _value_names: string[]
}

/**
 * Flattens inline refs across resolved groups into the deterministic
 * `InlinePlanEntry[]` shape consumed by the create / update wrappers.
 * Order: per group → inline variant refs → inline product refs. Both
 * wrappers recompute the plan the same way, so the resulting indices
 * align with the flat outputs of `createProductAttributesStep` /
 * `createProductAttributeValuesStep`.
 */
/**
 * Drops empty entries and de-duplicates value names per ref. The
 * underlying `ProductAttributeValue` uniqueness index is on
 * `(attribute_id, handle)`, but two values with the same `name` are
 * legal at the DB level — the UI form, however, treats names as the
 * user-facing identity. Deduping here keeps the materialised set in
 * line with what the form expects to round-trip.
 */
const dedupeValueNames = (values: string[]): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of values) {
    const trimmed = v?.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

export function buildInlinePlan(
  groups: ResolvedRefs[],
  productIdAt: (groupIdx: number) => string | undefined,
): InlinePlanEntry[] {
  const plan: InlinePlanEntry[] = []
  groups.forEach((r, idx) => {
    const product_id = productIdAt(idx)
    if (!product_id) return
    for (const ref of r.inline_variant) {
      plan.push({
        name: ref.name,
        type: ref.type,
        is_variant_axis: true,
        is_filterable: ref.is_filterable ?? false,
        is_required: ref.is_required ?? false,
        description: ref.description ?? null,
        metadata: ref.metadata ?? null,
        product_id,
        _group_idx: idx,
        _value_names: dedupeValueNames(ref.values),
      })
    }
    for (const ref of r.inline_product) {
      plan.push({
        name: ref.name,
        type: ref.type,
        is_variant_axis: ref.is_variant_axis,
        is_filterable: ref.is_filterable ?? false,
        is_required: ref.is_required ?? false,
        description: ref.description ?? null,
        metadata: ref.metadata ?? null,
        product_id,
        _group_idx: idx,
        _value_names: dedupeValueNames(ref.values),
      })
    }
  })
  return plan
}
