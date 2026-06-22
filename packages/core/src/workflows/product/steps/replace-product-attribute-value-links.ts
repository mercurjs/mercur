import { Link } from "@medusajs/framework/modules-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type AttributeValueLink = {
  product_id: string
  product_attribute_value_id: string
}

export type ReplaceProductAttributeValueLinksInput = {
  /**
   * When false, the step is a no-op — the existing link set is
   * preserved. Set true only when the update payload explicitly carried
   * `variant_attributes` / `product_attributes`.
   */
  replace: boolean
  product_ids: string[]
  links: AttributeValueLink[]
}

type RevertState = {
  removed: AttributeValueLink[]
}

export const replaceProductAttributeValueLinksStepId =
  "mercur-replace-product-attribute-value-links"

/**
 * Replaces the `product_attribute_value_link` set for the given
 * products with `input.links`. Existing rows for the target products
 * are dismissed first so values un-checked in the edit form actually
 * disappear.
 *
 * `link.list` cannot be used here because two links exist between the
 * Product and ProductAttribute modules (the value link and the
 * read-only product-scoping link), so we read the existing linked
 * value ids through `query.graph` instead — the joiner alias
 * `attribute_values` is unambiguous.
 */
export const replaceProductAttributeValueLinksStep = createStep(
  replaceProductAttributeValueLinksStepId,
  async (
    input: ReplaceProductAttributeValueLinksInput,
    { container },
  ) => {
    if (!input.replace || !input.product_ids?.length) {
      return new StepResponse(undefined, { removed: [] } as RevertState)
    }

    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "attribute_values.id"],
      filters: { id: input.product_ids },
    })

    const existing: AttributeValueLink[] = []
    for (const p of products) {
      const vals =
        ((p as { attribute_values?: Array<{ id: string }> }).attribute_values ??
          []) as Array<{ id: string }>
      for (const v of vals) {
        if (v?.id)
          existing.push({
            product_id: p.id as string,
            product_attribute_value_id: v.id,
          })
      }
    }

    if (existing.length) {
      await link.dismiss(
        existing.map((row) => ({
          [Modules.PRODUCT]: { product_id: row.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: row.product_attribute_value_id,
          },
        })),
      )
    }

    if (input.links.length) {
      await link.create(
        input.links.map((l) => ({
          [Modules.PRODUCT]: { product_id: l.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: l.product_attribute_value_id,
          },
        })),
      )
    }

    return new StepResponse(undefined, { removed: existing } as RevertState)
  },
  async (prev, { container }) => {
    const state = prev as RevertState | undefined
    if (!state?.removed?.length) return
    const link: Link = container.resolve(ContainerRegistrationKeys.LINK)
    await link.create(
      state.removed.map((row) => ({
        [Modules.PRODUCT]: { product_id: row.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: row.product_attribute_value_id,
        },
      })),
    )
  },
)
