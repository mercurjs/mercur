import {
  IProductModuleService,
  LinkDefinition,
  Query,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

/**
 * SPEC-014 catalog mirror maintenance.
 *
 * For each variant-axis attribute (`is_variant_axis = true`, `multi_select`),
 * create its native Medusa `ProductOption` mirror plus value mirrors, and
 * return the link definitions tying attribute → option and each
 * attribute value → option value. The workflow persists the returned links
 * via `createRemoteLinkStep`.
 *
 *  - `is_exclusive: false` → shared global option (catalog attribute, reusable
 *    across products).
 *  - `is_exclusive: true`  → option scoped to one product (inline axis).
 *
 * Compensation deletes the created options (option-value rows cascade).
 */
export type MirrorAxisAttributesInput = Array<{
  attribute_id: string
  title: string
  is_exclusive: boolean
}>

export type MirrorAxisAttributesOutput = { links: LinkDefinition[] }

type Compensation = { created_option_ids: string[] }

export const mirrorAxisAttributesToOptionsStepId =
  "pa-mirror-axis-attributes-to-options"

export const mirrorAxisAttributesToOptionsStep = createStep(
  mirrorAxisAttributesToOptionsStepId,
  async (input: MirrorAxisAttributesInput, { container }) => {
    if (!input.length) {
      return new StepResponse<MirrorAxisAttributesOutput, Compensation>(
        { links: [] },
        { created_option_ids: [] },
      )
    }

    const attrService = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const attributeIds = input.map((e) => e.attribute_id)
    const values = await attrService.listProductAttributeValues(
      { attribute_id: attributeIds },
      { select: ["id", "name", "attribute_id", "rank"] },
    )

    const valuesByAttr = new Map<
      string,
      Array<{ id: string; name: string; rank: number }>
    >()
    for (const v of values) {
      const key = v.attribute_id as string
      const arr = valuesByAttr.get(key) ?? []
      arr.push({ id: v.id, name: v.name, rank: v.rank ?? 0 })
      valuesByAttr.set(key, arr)
    }

    const links: LinkDefinition[] = []
    const created_option_ids: string[] = []

    for (const entry of input) {
      const attrValues = (valuesByAttr.get(entry.attribute_id) ?? []).sort(
        (a, b) => a.rank - b.rank,
      )

      const [option] = await productService.createProductOptions([
        {
          title: entry.title,
          values: attrValues.map((v) => v.name),
          is_exclusive: entry.is_exclusive,
        },
      ])
      created_option_ids.push(option.id)

      links.push({
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_id: entry.attribute_id,
        },
        [Modules.PRODUCT]: { product_option_id: option.id },
      })

      const optionValueIdByName = new Map(
        (option.values ?? []).map((ov) => [ov.value, ov.id]),
      )
      for (const v of attrValues) {
        const optionValueId = optionValueIdByName.get(v.name)
        if (!optionValueId) continue
        links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: v.id,
          },
          [Modules.PRODUCT]: { product_option_value_id: optionValueId },
        })
      }
    }

    return new StepResponse<MirrorAxisAttributesOutput, Compensation>(
      { links },
      { created_option_ids },
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation?.created_option_ids.length) return
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )
    await productService.deleteProductOptions(compensation.created_option_ids)
  },
)

/**
 * SPEC-014 §F: reconcile the option mirror after an attribute UPDATE.
 *
 *  - became axis (`multi_select` + `is_variant_axis`) with no existing mirror
 *    → create the shared option + value mirrors, return their create link defs.
 *  - already mirrored and the name changed → rename the option title in place.
 *  - flip-OFF (mirror exists but no longer axis) → delete the mirror option and
 *    return explicit dismiss defs for the attribute→option and
 *    value→optionvalue links (explicit because a wildcard `[PRODUCT]: {}` can't
 *    disambiguate them from the product↔value selection link).
 */
export type ReconcileAxisMirrorOutput = {
  links: LinkDefinition[]
  dismiss_links: LinkDefinition[]
}

export const reconcileAxisAttributeMirrorStepId =
  "pa-reconcile-axis-attribute-mirror"

export const reconcileAxisAttributeMirrorStep = createStep(
  reconcileAxisAttributeMirrorStepId,
  async (input: { attribute_ids: string[] }, { container }) => {
    const empty = new StepResponse<ReconcileAxisMirrorOutput, Compensation>(
      { links: [], dismiss_links: [] },
      { created_option_ids: [] },
    )
    if (!input.attribute_ids.length) return empty

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const { data } = await query.graph({
      entity: "product_attribute",
      fields: [
        "id",
        "name",
        "type",
        "is_variant_axis",
        "mirror_option.id",
        "mirror_option.title",
        "values.id",
        "values.name",
        "values.rank",
        "values.mirror_option_value.id",
      ],
      filters: { id: input.attribute_ids },
    })

    const links: LinkDefinition[] = []
    const dismiss_links: LinkDefinition[] = []
    const created_option_ids: string[] = []

    for (const attr of data as Array<{
      id: string
      name: string
      type: string
      is_variant_axis?: boolean
      mirror_option?: { id?: string; title?: string } | null
      values?: Array<{
        id: string
        name: string
        rank?: number
        mirror_option_value?: { id?: string } | null
      }>
    }>) {
      const desired =
        attr.type === AttributeType.MULTI_SELECT && !!attr.is_variant_axis
      const mirrorId = attr.mirror_option?.id

      if (desired && !mirrorId) {
        const attrValues = (attr.values ?? []).sort(
          (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
        )
        const [option] = await productService.createProductOptions([
          {
            title: attr.name,
            values: attrValues.map((v) => v.name),
            is_exclusive: false,
          },
        ])
        created_option_ids.push(option.id)
        links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: { product_attribute_id: attr.id },
          [Modules.PRODUCT]: { product_option_id: option.id },
        })
        const optionValueIdByName = new Map(
          (option.values ?? []).map((ov) => [ov.value, ov.id]),
        )
        for (const v of attrValues) {
          const optionValueId = optionValueIdByName.get(v.name)
          if (!optionValueId) continue
          links.push({
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_value_id: v.id,
            },
            [Modules.PRODUCT]: { product_option_value_id: optionValueId },
          })
        }
      } else if (desired && mirrorId && attr.mirror_option?.title !== attr.name) {
        await productService.updateProductOptions(mirrorId, { title: attr.name })
      } else if (!desired && mirrorId) {
        // flip-OFF: tear the mirror down.
        dismiss_links.push({
          [MercurModules.PRODUCT_ATTRIBUTE]: { product_attribute_id: attr.id },
          [Modules.PRODUCT]: { product_option_id: mirrorId },
        })
        for (const v of attr.values ?? []) {
          const ovId = v.mirror_option_value?.id
          if (!ovId) continue
          dismiss_links.push({
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_value_id: v.id,
            },
            [Modules.PRODUCT]: { product_option_value_id: ovId },
          })
        }
        await productService.deleteProductOptions([mirrorId])
      }
    }

    return new StepResponse<ReconcileAxisMirrorOutput, Compensation>(
      { links, dismiss_links },
      { created_option_ids },
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation?.created_option_ids.length) return
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )
    await productService.deleteProductOptions(compensation.created_option_ids)
  },
)
