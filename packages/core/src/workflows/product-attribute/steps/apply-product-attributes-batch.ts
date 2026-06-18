import {
  IProductModuleService,
  LinkDefinition,
  Query,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, MercurModules } from "@mercurjs/types"

/**
 * SPEC-014 §G apply engine — mutate one product's attributes (EXISTING refs).
 * Order: remove → add → update (so an attribute can be re-added in one call).
 *
 *   - axis (`multi_select` + `is_variant_axis`): attach/detach the native mirror
 *     option to the product (`add`/`remove`) and adjust its per-product value
 *     subset (`update`).
 *   - non-axis select: link / unlink `product_attribute_value_link` rows.
 *   - toggle: resolve the boolean to the seeded true/false value and link it.
 *
 * Inline (`title`) refs, exclusive/scoped attributes, and free-form text/unit
 * value creation are owed (SPEC-014 §G) — only `{ id }` refs are handled.
 *
 * Returns explicit link create/dismiss defs; the workflow applies them via the
 * remote-link steps. Option attach/detach/subset happen in-step (best effort,
 * no compensation).
 */
export type BatchAddRef = {
  id: string
  value_ids?: string[]
  value?: string | number | boolean
}
export type BatchUpdateRef = {
  id: string
  add?: string[]
  remove?: string[]
  value?: string | number | boolean
}

export type ApplyProductAttributesBatchInput = {
  product_id: string
  add?: BatchAddRef[]
  remove?: string[]
  update?: BatchUpdateRef[]
}

export type ApplyProductAttributesBatchOutput = {
  create_value_links: LinkDefinition[]
  dismiss_value_links: LinkDefinition[]
}

type LoadedAttr = {
  id: string
  type: AttributeType
  is_variant_axis?: boolean
  mirror_option?: { id?: string } | null
  values?: Array<{
    id: string
    name: string
    mirror_option_value?: { id?: string } | null
  }> | null
}

export const applyProductAttributesBatchStepId =
  "pa-apply-product-attributes-batch"

export const applyProductAttributesBatchStep = createStep(
  applyProductAttributesBatchStepId,
  async (input: ApplyProductAttributesBatchInput, { container }) => {
    const out: ApplyProductAttributesBatchOutput = {
      create_value_links: [],
      dismiss_value_links: [],
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const referencedIds = new Set<string>([
      ...(input.add ?? []).map((r) => r.id),
      ...(input.update ?? []).map((r) => r.id),
      ...(input.remove ?? []),
    ])
    if (!referencedIds.size) return new StepResponse(out)

    const { data: attrs } = await query.graph({
      entity: "product_attribute",
      fields: [
        "id",
        "type",
        "is_variant_axis",
        "mirror_option.id",
        "values.id",
        "values.name",
        "values.mirror_option_value.id",
      ],
      filters: { id: Array.from(referencedIds) },
    })
    const byId = new Map<string, LoadedAttr>(
      (attrs as LoadedAttr[]).map((a) => [a.id, a]),
    )

    // current non-axis value links on the product (id + owning attribute)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "attribute_values.id", "attribute_values.attribute.id"],
      filters: { id: input.product_id },
    })
    const currentValues = (products[0]?.attribute_values ?? []) as Array<{
      id: string
      attribute?: { id?: string } | null
    }>

    const pid = input.product_id
    const isAxis = (a: LoadedAttr) =>
      a.type === AttributeType.MULTI_SELECT && !!a.is_variant_axis
    const mirrorValueIds = (a: LoadedAttr, valueIds: string[]) => {
      const map = new Map(
        (a.values ?? []).map((v) => [v.id, v.mirror_option_value?.id]),
      )
      return valueIds
        .map((id) => map.get(id))
        .filter((id): id is string => !!id)
    }
    const valueLink = (value_id: string): LinkDefinition => ({
      [Modules.PRODUCT]: { product_id: pid },
      [MercurModules.PRODUCT_ATTRIBUTE]: {
        product_attribute_value_id: value_id,
      },
    })
    const requireAttr = (id: string) => {
      const a = byId.get(id)
      if (!a) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product attribute ${id} not found`,
        )
      }
      return a
    }

    // ---- remove ----
    for (const attributeId of input.remove ?? []) {
      const attr = requireAttr(attributeId)
      if (isAxis(attr) && attr.mirror_option?.id) {
        await productService.removeProductOptionFromProduct([
          { product_option_id: attr.mirror_option.id, product_id: pid },
        ])
        continue
      }
      // non-axis: dismiss this attribute's currently-linked value links
      const valueIds = new Set((attr.values ?? []).map((v) => v.id))
      for (const cur of currentValues) {
        if (valueIds.has(cur.id) || cur.attribute?.id === attributeId) {
          out.dismiss_value_links.push(valueLink(cur.id))
        }
      }
    }

    // ---- add ----
    for (const ref of input.add ?? []) {
      const attr = requireAttr(ref.id)
      if (isAxis(attr) && attr.mirror_option?.id) {
        const subset = mirrorValueIds(attr, ref.value_ids ?? [])
        await productService.addProductOptionToProduct([
          {
            product_option_id: attr.mirror_option.id,
            product_id: pid,
            ...(subset.length ? { product_option_value_ids: subset } : {}),
          },
        ])
        continue
      }
      if (attr.type === AttributeType.TOGGLE) {
        const match = (attr.values ?? []).find(
          (v) => v.name === String(ref.value),
        )
        if (match) out.create_value_links.push(valueLink(match.id))
        continue
      }
      for (const vid of ref.value_ids ?? []) {
        out.create_value_links.push(valueLink(vid))
      }
      if (ref.value !== undefined) {
        const match = (attr.values ?? []).find(
          (v) => v.name === String(ref.value),
        )
        if (match) out.create_value_links.push(valueLink(match.id))
      }
    }

    // ---- update ----
    for (const ref of input.update ?? []) {
      const attr = requireAttr(ref.id)
      if (isAxis(attr) && attr.mirror_option?.id) {
        const add = mirrorValueIds(attr, ref.add ?? [])
        const remove = mirrorValueIds(attr, ref.remove ?? [])
        if (add.length || remove.length) {
          await productService.updateProductOptionValuesOnProduct([
            {
              product_option_id: attr.mirror_option.id,
              product_id: pid,
              ...(add.length ? { add } : {}),
              ...(remove.length ? { remove } : {}),
            },
          ])
        }
        continue
      }
      if (attr.type === AttributeType.TOGGLE && ref.value !== undefined) {
        // swap the linked boolean value
        for (const v of attr.values ?? []) {
          if (v.name === String(ref.value)) {
            out.create_value_links.push(valueLink(v.id))
          } else {
            out.dismiss_value_links.push(valueLink(v.id))
          }
        }
        continue
      }
      for (const vid of ref.add ?? []) out.create_value_links.push(valueLink(vid))
      for (const vid of ref.remove ?? [])
        out.dismiss_value_links.push(valueLink(vid))
    }

    return new StepResponse(out)
  },
)
