import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { AttributeType, MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

/**
 * SPEC-014 §H: resolve vendor "add" operations into pre-resolved
 * `{ attribute_id, attribute_value_ids }` for staging as `ATTRIBUTE_ADD`
 * change actions — without the legacy resolve-refs/materialize machinery.
 *
 *   - `value_ids` pass through.
 *   - `values` (names) resolve to the attribute's existing value ids; an
 *     unresolved name on a `single_select`/`multi_select` is a NOT_FOUND; on
 *     `text`/`unit` it is created (free-form). `toggle` names must already
 *     exist (the seeded `true`/`false`).
 *
 * Created free-form values are removed on compensation.
 */
export type ResolveAttributeAddActionsInput = {
  product_id: string
  add_ops: Array<{
    attribute_id: string
    value_ids?: string[]
    values?: string[]
  }>
}

export type ResolvedAddAction = {
  product_id: string
  attribute_id: string
  attribute_value_ids: string[]
}

export const resolveAttributeAddActionsStepId =
  "pa-resolve-attribute-add-actions"

export const resolveAttributeAddActionsStep = createStep(
  resolveAttributeAddActionsStepId,
  async (input: ResolveAttributeAddActionsInput, { container }) => {
    if (!input.add_ops.length) {
      return new StepResponse<ResolvedAddAction[], string[]>([], [])
    }

    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )

    const attributeIds = Array.from(
      new Set(input.add_ops.map((o) => o.attribute_id)),
    )
    const attrs = await service.listProductAttributes(
      { id: attributeIds },
      { relations: ["values"], select: ["id", "type"] },
    )
    const byId = new Map(
      attrs.map((a) => [
        a.id,
        {
          type: a.type as AttributeType,
          nameToId: new Map((a.values ?? []).map((v) => [v.name, v.id])),
          valueIds: new Set((a.values ?? []).map((v) => v.id)),
        },
      ]),
    )

    const createdValueIds: string[] = []
    const actions: ResolvedAddAction[] = []

    for (const op of input.add_ops) {
      const attr = byId.get(op.attribute_id)
      if (!attr) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product attribute ${op.attribute_id} not found`,
        )
      }

      const resolvedIds = new Set<string>()
      for (const id of op.value_ids ?? []) {
        if (attr.valueIds.has(id)) resolvedIds.add(id)
      }

      const toCreate: string[] = []
      for (const raw of op.values ?? []) {
        const name = raw?.trim()
        if (!name) continue
        const existing = attr.nameToId.get(name)
        if (existing) {
          resolvedIds.add(existing)
          continue
        }
        if (
          attr.type === AttributeType.SINGLE_SELECT ||
          attr.type === AttributeType.MULTI_SELECT ||
          attr.type === AttributeType.TOGGLE
        ) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Product attribute value "${name}" not found on attribute ${op.attribute_id}`,
          )
        }
        toCreate.push(name)
      }

      if (toCreate.length) {
        const created = await service.createProductAttributeValues(
          toCreate.map((name) => ({ name, attribute_id: op.attribute_id })),
        )
        for (const v of created) {
          resolvedIds.add(v.id)
          createdValueIds.push(v.id)
        }
      }

      if (resolvedIds.size) {
        actions.push({
          product_id: input.product_id,
          attribute_id: op.attribute_id,
          attribute_value_ids: Array.from(resolvedIds),
        })
      }
    }

    return new StepResponse<ResolvedAddAction[], string[]>(
      actions,
      createdValueIds,
    )
  },
  async (createdValueIds: string[] | undefined, { container }) => {
    if (!createdValueIds?.length) return
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    await service.deleteProductAttributeValues(createdValueIds)
  },
)
