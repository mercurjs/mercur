import {
  IProductModuleService,
  LinkDefinition,
  Query,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, MercurModules } from "@mercurjs/types"

/**
 * SPEC-014 §H: confirm-time apply of staged attribute change actions, on the
 * native-option model (replaces the legacy shadow-option + variant-attribute
 * link logic). Handles multiple products and the add/remove action shape
 * surfaced by the ProductChange dispatcher.
 *
 *   - axis (`multi_select` + `is_variant_axis`): attach/detach the native
 *     mirror option (with the action's value subset).
 *   - non-axis: create/dismiss `product_attribute_value_link` rows.
 *
 * Returns explicit value-link create/dismiss defs; option attach/detach happen
 * in-step. Removes are processed before adds.
 */
export type AttributeChangeAddAction = {
  product_id: string
  attribute_id: string
  attribute_value_ids: string[]
}
export type AttributeChangeRemoveAction = {
  product_id: string
  attribute_id: string
}

export type ApplyAttributeChangeActionsInput = {
  add_actions: AttributeChangeAddAction[]
  remove_actions: AttributeChangeRemoveAction[]
}

export type ApplyAttributeChangeActionsOutput = {
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
    mirror_option_value?: { id?: string } | null
  }> | null
}

export const applyAttributeChangeActionsStepId =
  "pa-apply-attribute-change-actions"

export const applyAttributeChangeActionsStep = createStep(
  applyAttributeChangeActionsStepId,
  async (input: ApplyAttributeChangeActionsInput, { container }) => {
    const out: ApplyAttributeChangeActionsOutput = {
      create_value_links: [],
      dismiss_value_links: [],
    }
    const referencedIds = new Set<string>([
      ...input.add_actions.map((a) => a.attribute_id),
      ...input.remove_actions.map((r) => r.attribute_id),
    ])
    if (!referencedIds.size) return new StepResponse(out)

    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
    const productService = container.resolve<IProductModuleService>(
      Modules.PRODUCT,
    )

    const { data: attrs } = await query.graph({
      entity: "product_attribute",
      fields: [
        "id",
        "type",
        "is_variant_axis",
        "mirror_option.id",
        "values.id",
        "values.mirror_option_value.id",
      ],
      filters: { id: Array.from(referencedIds) },
    })
    const byId = new Map<string, LoadedAttr>(
      (attrs as LoadedAttr[]).map((a) => [a.id, a]),
    )

    const isAxis = (a: LoadedAttr) =>
      a.type === AttributeType.MULTI_SELECT && !!a.is_variant_axis
    const valueLink = (product_id: string, value_id: string): LinkDefinition => ({
      [Modules.PRODUCT]: { product_id },
      [MercurModules.PRODUCT_ATTRIBUTE]: {
        product_attribute_value_id: value_id,
      },
    })

    // ---- removes first ----
    for (const action of input.remove_actions) {
      const attr = byId.get(action.attribute_id)
      if (!attr) continue
      if (isAxis(attr) && attr.mirror_option?.id) {
        await productService.removeProductOptionFromProduct([
          { product_option_id: attr.mirror_option.id, product_id: action.product_id },
        ])
        continue
      }
      for (const v of attr.values ?? []) {
        out.dismiss_value_links.push(valueLink(action.product_id, v.id))
      }
    }

    // ---- adds ----
    for (const action of input.add_actions) {
      const attr = byId.get(action.attribute_id)
      if (!attr) continue
      if (isAxis(attr) && attr.mirror_option?.id) {
        const map = new Map(
          (attr.values ?? []).map((v) => [v.id, v.mirror_option_value?.id]),
        )
        const subset = action.attribute_value_ids
          .map((id) => map.get(id))
          .filter((id): id is string => !!id)
        await productService.addProductOptionToProduct([
          {
            product_option_id: attr.mirror_option.id,
            product_id: action.product_id,
            ...(subset.length ? { product_option_value_ids: subset } : {}),
          },
        ])
        continue
      }
      for (const valueId of action.attribute_value_ids) {
        out.create_value_links.push(valueLink(action.product_id, valueId))
      }
    }

    return new StepResponse(out)
  },
)
