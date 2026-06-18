import { LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

/**
 * SPEC-014 §D: post-create materialization of the unified `attributes[]` parts
 * that aren't plain existing-value links:
 *
 *   - **free-form** values (`text`/`unit`) against an EXISTING attribute →
 *     create the value on the attribute and link product↔value.
 *   - **inline** (`title`) attributes → create a product-scoped
 *     `ProductAttribute` (+ values). For an axis inline, link it to the
 *     exclusive `ProductOption` stock already created from the inline option
 *     input (matched by title) + mirror each value; otherwise link product↔value.
 *
 * Returns the link defs (persisted by the workflow). Compensation removes the
 * scoped attributes + free-form values it created.
 */
export type MaterializeCreateAttributesItem = {
  product_id: string
  product_options: Array<{
    title: string
    id: string
    values: Array<{ value: string; id: string }>
  }>
  inline: Array<{
    title: string
    type: AttributeType
    is_variant_axis: boolean
    values: string[]
    is_filterable?: boolean
    is_required?: boolean
    description?: string | null
    metadata?: Record<string, unknown> | null
  }>
  free_form: Array<{ attribute_id: string; names: string[] }>
}

export type MaterializeCreateAttributesOutput = { links: LinkDefinition[] }

type Compensation = { attribute_ids: string[]; value_ids: string[] }

export const materializeCreateAttributesStepId =
  "mercur-materialize-create-attributes"

export const materializeCreateAttributesStep = createStep(
  materializeCreateAttributesStepId,
  async (
    input: { items: MaterializeCreateAttributesItem[] },
    { container },
  ) => {
    const hasWork = input.items.some(
      (i) => i.inline.length || i.free_form.length,
    )
    if (!hasWork) {
      return new StepResponse<MaterializeCreateAttributesOutput, Compensation>(
        { links: [] },
        { attribute_ids: [], value_ids: [] },
      )
    }

    const attrService = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )

    const links: LinkDefinition[] = []
    const createdAttributeIds: string[] = []
    const createdValueIds: string[] = []

    const valueLink = (product_id: string, value_id: string): LinkDefinition => ({
      [Modules.PRODUCT]: { product_id },
      [MercurModules.PRODUCT_ATTRIBUTE]: {
        product_attribute_value_id: value_id,
      },
    })

    for (const item of input.items) {
      // free-form values on existing attributes
      for (const ff of item.free_form) {
        if (!ff.names.length) continue
        const created = await attrService.createProductAttributeValues(
          ff.names.map((name) => ({ name, attribute_id: ff.attribute_id })),
        )
        for (const v of created) {
          createdValueIds.push(v.id)
          links.push(valueLink(item.product_id, v.id))
        }
      }

      // inline (product-scoped) attributes
      for (const inline of item.inline) {
        const [attr] = await attrService.createProductAttributes([
          {
            name: inline.title,
            type: inline.type,
            is_variant_axis: inline.is_variant_axis,
            is_filterable: inline.is_filterable ?? false,
            is_required: inline.is_required ?? false,
            description: inline.description ?? null,
            metadata: inline.metadata ?? null,
            product_id: item.product_id,
          },
        ])
        createdAttributeIds.push(attr.id)

        const createdValues = inline.values.length
          ? await attrService.createProductAttributeValues(
              inline.values.map((name, rank) => ({
                name,
                rank,
                attribute_id: attr.id,
              })),
            )
          : []
        for (const v of createdValues) createdValueIds.push(v.id)

        const isAxis =
          inline.type === AttributeType.MULTI_SELECT && inline.is_variant_axis

        if (isAxis) {
          const option = item.product_options.find(
            (o) => o.title === inline.title,
          )
          if (option) {
            links.push({
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_id: attr.id,
              },
              [Modules.PRODUCT]: { product_option_id: option.id },
            })
            const optionValueByName = new Map(
              option.values.map((ov) => [ov.value, ov.id]),
            )
            for (const v of createdValues) {
              const ovId = optionValueByName.get(v.name)
              if (!ovId) continue
              links.push({
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_value_id: v.id,
                },
                [Modules.PRODUCT]: { product_option_value_id: ovId },
              })
            }
          }
        } else {
          for (const v of createdValues) {
            links.push(valueLink(item.product_id, v.id))
          }
        }
      }
    }

    return new StepResponse<MaterializeCreateAttributesOutput, Compensation>(
      { links },
      { attribute_ids: createdAttributeIds, value_ids: createdValueIds },
    )
  },
  async (compensation: Compensation | undefined, { container }) => {
    if (!compensation) return
    const attrService = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    if (compensation.value_ids.length) {
      await attrService.deleteProductAttributeValues(compensation.value_ids)
    }
    if (compensation.attribute_ids.length) {
      await attrService.deleteProductAttributes(compensation.attribute_ids)
    }
    // The exclusive mirror option for an inline axis attribute is the product's
    // own option created by stock; it is removed when the product rolls back.
  },
)
