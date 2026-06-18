import {
  CreateProductOptionValueDTO,
  IProductModuleService,
  LinkDefinition,
  Query,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

type AttributeValueRow = {
  id: string
  name: string
  attribute?: { is_variant_axis?: boolean; mirror_option?: { id?: string } | null } | null
  mirror_option_value?: { id?: string; value?: string } | null
}

const loadValueRows = async (query: Query, valueIds: string[]) => {
  const { data } = await query.graph({
    entity: "product_attribute_value",
    fields: [
      "id",
      "name",
      "attribute.is_variant_axis",
      "attribute.mirror_option.id",
      "mirror_option_value.id",
      "mirror_option_value.value",
    ],
    filters: { id: valueIds },
  })
  return data as AttributeValueRow[]
}

/**
 * SPEC-014 §F: reconcile mirror option values for the given attribute value ids.
 *
 * Idempotent — covers create, upsert and rename uniformly:
 *  - value belongs to an axis-mirrored attribute but has no mirror option value
 *    → create the option value and return the value→optionvalue link def.
 *  - mirror option value exists but its text drifted from the attribute value
 *    name → rename it in place (keeps the option value id, so variant
 *    references survive).
 *  - non-axis / unmirrored attributes → ignored.
 *
 * Compensation deletes any option values this step created.
 */
export const syncAttributeValueMirrorsStepId = "pa-sync-attribute-value-mirrors"

export const syncAttributeValueMirrorsStep = createStep(
  syncAttributeValueMirrorsStepId,
  async (input: { value_ids: string[] }, { container }) => {
    const empty = new StepResponse<{ links: LinkDefinition[] }, { created_option_value_ids: string[] }>(
      { links: [] },
      { created_option_value_ids: [] },
    )
    if (!input.value_ids.length) return empty

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const rows = await loadValueRows(query, input.value_ids)

    const links: LinkDefinition[] = []
    const created_option_value_ids: string[] = []

    for (const row of rows) {
      const optionId = row.attribute?.mirror_option?.id
      if (!row.attribute?.is_variant_axis || !optionId) continue

      const mirror = row.mirror_option_value
      if (!mirror?.id) {
        const [created] = await productService.createProductOptionValues([
          { value: row.name, option_id: optionId } as unknown as CreateProductOptionValueDTO,
        ])
        created_option_value_ids.push(created.id)
        links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: row.id,
          },
          [Modules.PRODUCT]: { product_option_value_id: created.id },
        })
      } else if (mirror.value !== row.name) {
        await productService.updateProductOptionValues(mirror.id, {
          value: row.name,
        })
      }
    }

    return new StepResponse<{ links: LinkDefinition[] }, { created_option_value_ids: string[] }>(
      { links },
      { created_option_value_ids },
    )
  },
  async (compensation: { created_option_value_ids: string[] } | undefined, { container }) => {
    if (!compensation?.created_option_value_ids.length) return
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )
    await productService.deleteProductOptionValues(
      compensation.created_option_value_ids,
    )
  },
)

/**
 * SPEC-014 §F: prepare deletion of attribute values.
 *
 * Run BEFORE the attribute values are removed (while links still resolve). It:
 *   1. deletes the mirror option values (axis attributes), and
 *   2. returns explicit dismiss link-defs for BOTH product-module links of each
 *      value — the product↔value selection link and the value→optionvalue
 *      mirror link.
 *
 * The defs are explicit (real `product_id` / `product_option_value_id` keys)
 * because a wildcard `[PRODUCT]: {}` can no longer disambiguate the two links
 * that now share `product_attribute_value_id → PRODUCT`
 * (`getLinkModule` keys on the exact module + key tuple).
 */
export const unmirrorDeletedAttributeValuesStepId =
  "pa-unmirror-deleted-attribute-values"

export const unmirrorDeletedAttributeValuesStep = createStep(
  unmirrorDeletedAttributeValuesStepId,
  async (input: { value_ids: string[] }, { container }) => {
    if (!input.value_ids.length) {
      return new StepResponse<{ dismiss_links: LinkDefinition[] }>({
        dismiss_links: [],
      })
    }

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const { data } = await query.graph({
      entity: "product_attribute_value",
      fields: [
        "id",
        "mirror_option_value.id",
        "owning_products.id",
      ],
      filters: { id: input.value_ids },
    })

    const rows = data as Array<{
      id: string
      mirror_option_value?: { id?: string } | null
      owning_products?: Array<{ id: string }> | null
    }>

    const optionValueIds = rows
      .map((r) => r.mirror_option_value?.id)
      .filter((id): id is string => !!id)

    const dismiss_links: LinkDefinition[] = []
    for (const row of rows) {
      for (const product of row.owning_products ?? []) {
        dismiss_links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: row.id,
          },
          [Modules.PRODUCT]: { product_id: product.id },
        })
      }
      if (row.mirror_option_value?.id) {
        dismiss_links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: row.id,
          },
          [Modules.PRODUCT]: {
            product_option_value_id: row.mirror_option_value.id,
          },
        })
      }
    }

    if (optionValueIds.length) {
      await productService.deleteProductOptionValues(optionValueIds)
    }

    return new StepResponse<{ dismiss_links: LinkDefinition[] }>({
      dismiss_links,
    })
  },
)
