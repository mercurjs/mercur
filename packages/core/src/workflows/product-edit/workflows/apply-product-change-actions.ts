import { LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createProductVariantsWorkflow,
  createRemoteLinkStep,
  deleteProductsWorkflow,
  deleteProductVariantsWorkflow,
  dismissRemoteLinkStep,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules, ProductChangeActionType } from "@mercurjs/types"

import { updateProductChangeActionsStep } from "../steps"
import { upsertProductOptionsForAxisStep } from "../../product-attribute/steps"

export type ApplyProductChangeActionsWorkflowInput = {
  change_ids: string[]
}

type BucketedActions = {
  productUpdates: Array<Record<string, unknown> & { id: string }>
  variantCreates: Array<Record<string, unknown> & { product_id: string }>
  variantUpdates: Array<Record<string, unknown> & { id: string }>
  variantDeletes: string[]
  attributeAdds: Array<{
    product_id: string
    attribute_id: string
    attribute_value_ids: string[]
  }>
  attributeRemoves: Array<{ product_id: string; attribute_id: string }>
  productsToDelete: string[]
  pendingActionIds: string[]
}

export const applyProductChangeActionsWorkflowId =
  "apply-product-change-actions"

/**
 * Cross-module dispatcher for a confirmed `ProductChange`'s pending
 * actions. Replaces the legacy `ProductModuleService.applyProductChangeActions_`
 * by composing stock Medusa product workflows (update/create/delete
 * variants, update/delete products) with Module-Link writes for
 * attribute pivots.
 *
 * Pattern-match `medusa/.../order/workflows/apply-order-change.ts`:
 * load pending rows, bucket by action type, dispatch in dependency
 * order, then mark `applied = true`.
 *
 * Ordering mirrors the legacy implementation:
 *   1. Top-level field updates (STATUS_CHANGE / UPDATE) — collapsed by
 *      product so each product hits `updateProductsWorkflow` once.
 *   2. Variant deletes — frees up SKU / title uniqueness before adds.
 *   3. Variant creates.
 *   4. Variant updates — see a stable variant set.
 *   5. Attribute removes — happen before adds so a single change can
 *      re-link the same attribute with a different value set.
 *   6. Attribute adds.
 *   7. Product deletes — last so any audit-trail updates above write
 *      through before the row is soft-deleted.
 *   8. Mark action rows applied.
 *
 * `ATTRIBUTE_ADD` actions are expected to carry pre-resolved
 * `attribute_value_ids` in their `details` JSON. The find-or-create
 * branch (`details.values: string[]`) the legacy service supported
 * lives upstream now — workflows that stage an `ATTRIBUTE_ADD` call
 * `upsertProductAttributeValuesWorkflow` first to resolve names into
 * IDs before persisting the action.
 */
export const applyProductChangeActionsWorkflow: ReturnWorkflow<
  ApplyProductChangeActionsWorkflowInput,
  void,
  []
> = createWorkflow(
  applyProductChangeActionsWorkflowId,
  function (input: ApplyProductChangeActionsWorkflowInput) {
    const { data: actions } = useQueryGraphStep({
      entity: "product_change_action",
      fields: ["id", "product_id", "action", "details", "applied"],
      filters: {
        product_change_id: input.change_ids,
        applied: false,
      },
    }).config({ name: "pc-load-pending-actions" })

    const buckets = transform({ actions }, ({ actions }): BucketedActions => {
      const productUpdatesById = new Map<
        string,
        Record<string, unknown> & { id: string }
      >()
      const variantCreates: Array<
        Record<string, unknown> & { product_id: string }
      > = []
      const variantUpdates: Array<Record<string, unknown> & { id: string }> = []
      const variantDeletes: string[] = []
      const attributeAdds: BucketedActions["attributeAdds"] = []
      const attributeRemoves: BucketedActions["attributeRemoves"] = []
      const productsToDelete = new Set<string>()
      const pendingActionIds: string[] = []

      for (const action of actions ?? []) {
        if (!action || action.applied) continue
        pendingActionIds.push(action.id as string)

        const productId = action.product_id as string
        const details = (action.details ?? {}) as Record<string, unknown>

        switch (action.action) {
          case ProductChangeActionType.STATUS_CHANGE: {
            const status = (details as { status?: string }).status
            if (status === undefined) break
            const u = productUpdatesById.get(productId) ?? { id: productId }
            u.status = status
            productUpdatesById.set(productId, u)
            break
          }
          case ProductChangeActionType.UPDATE: {
            const { field, value } = details as {
              field?: string
              value?: unknown
            }
            if (!field) break
            const u = productUpdatesById.get(productId) ?? { id: productId }
            u[field] = value
            productUpdatesById.set(productId, u)
            break
          }
          case ProductChangeActionType.VARIANT_ADD: {
            const variant = (
              details as { variant?: Record<string, unknown> }
            ).variant
            if (!variant) break
            variantCreates.push({ ...variant, product_id: productId })
            break
          }
          case ProductChangeActionType.VARIANT_UPDATE: {
            const { variant_id, fields } = details as {
              variant_id?: string
              fields?: Record<string, unknown>
            }
            if (
              !variant_id ||
              !fields ||
              !Object.keys(fields as object).length
            )
              break
            variantUpdates.push({ id: variant_id, ...fields })
            break
          }
          case ProductChangeActionType.VARIANT_REMOVE: {
            const variantId = (details as { variant_id?: string }).variant_id
            if (variantId) variantDeletes.push(variantId)
            break
          }
          case ProductChangeActionType.ATTRIBUTE_ADD: {
            const { attribute_id, attribute_value_ids } = details as {
              attribute_id?: string
              attribute_value_ids?: string[]
            }
            if (!attribute_id || !attribute_value_ids?.length) break
            attributeAdds.push({
              product_id: productId,
              attribute_id,
              attribute_value_ids,
            })
            break
          }
          case ProductChangeActionType.ATTRIBUTE_REMOVE: {
            const attributeId = (details as { attribute_id?: string })
              .attribute_id
            if (!attributeId) break
            attributeRemoves.push({
              product_id: productId,
              attribute_id: attributeId,
            })
            break
          }
          case ProductChangeActionType.PRODUCT_DELETE: {
            productsToDelete.add(productId)
            break
          }
        }
      }

      return {
        productUpdates: Array.from(productUpdatesById.values()).filter(
          (u) => Object.keys(u).length > 1,
        ),
        variantCreates,
        variantUpdates,
        variantDeletes,
        attributeAdds,
        attributeRemoves,
        productsToDelete: Array.from(productsToDelete),
        pendingActionIds,
      }
    })

    when({ buckets }, ({ buckets }) => buckets.productUpdates.length > 0).then(
      () => {
        updateProductsWorkflow.runAsStep({
          input: transform({ buckets }, ({ buckets }) => ({
            products: buckets.productUpdates as never,
          })),
        })
      },
    )

    when({ buckets }, ({ buckets }) => buckets.variantDeletes.length > 0).then(
      () => {
        deleteProductVariantsWorkflow.runAsStep({
          input: transform({ buckets }, ({ buckets }) => ({
            ids: buckets.variantDeletes,
          })),
        })
      },
    )

    when({ buckets }, ({ buckets }) => buckets.variantCreates.length > 0).then(
      () => {
        createProductVariantsWorkflow.runAsStep({
          input: transform({ buckets }, ({ buckets }) => ({
            product_variants: buckets.variantCreates as never,
          })),
        })
      },
    )

    when({ buckets }, ({ buckets }) => buckets.variantUpdates.length > 0).then(
      () => {
        updateProductVariantsWorkflow.runAsStep({
          input: transform({ buckets }, ({ buckets }) => ({
            product_variants: buckets.variantUpdates as never,
          })),
        })
      },
    )

    when(
      { buckets },
      ({ buckets }) => buckets.attributeRemoves.length > 0,
    ).then(() => {
      const removedAttributeIds = transform({ buckets }, ({ buckets }) =>
        Array.from(new Set(buckets.attributeRemoves.map((r) => r.attribute_id))),
      )

      const { data: valuesForRemoval } = useQueryGraphStep({
        entity: "product_attribute_value",
        fields: ["id", "attribute.id"],
        filters: { attribute_id: removedAttributeIds },
      }).config({ name: "pc-load-attribute-values-for-removal" })

      const valueLinksToDismiss = transform(
        { buckets, valuesForRemoval },
        ({ buckets, valuesForRemoval }) => {
          const valuesByAttr = new Map<string, string[]>()
          for (const v of valuesForRemoval ?? []) {
            const attrId = (v as { attribute?: { id?: string } }).attribute?.id
            if (!attrId) continue
            const list = valuesByAttr.get(attrId) ?? []
            list.push((v as { id: string }).id)
            valuesByAttr.set(attrId, list)
          }
          const links: LinkDefinition[] = []
          for (const r of buckets.attributeRemoves) {
            const valueIds = valuesByAttr.get(r.attribute_id) ?? []
            for (const valueId of valueIds) {
              links.push({
                [Modules.PRODUCT]: { product_id: r.product_id },
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_value_id: valueId,
                },
              })
            }
          }
          return links
        },
      )

      dismissRemoteLinkStep(valueLinksToDismiss).config({
        name: "pc-dismiss-attribute-value-links",
      })

      const variantAttrLinksToDismiss = transform(
        { buckets },
        ({ buckets }) =>
          buckets.attributeRemoves.map<LinkDefinition>((r) => ({
            [Modules.PRODUCT]: { product_id: r.product_id },
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_id: r.attribute_id,
            },
          })),
      )

      dismissRemoteLinkStep(variantAttrLinksToDismiss).config({
        name: "pc-dismiss-variant-attribute-links",
      })
    })

    when({ buckets }, ({ buckets }) => buckets.attributeAdds.length > 0).then(
      () => {
        const addedAttributeIds = transform({ buckets }, ({ buckets }) =>
          Array.from(new Set(buckets.attributeAdds.map((a) => a.attribute_id))),
        )

        const { data: addedAttributes } = useQueryGraphStep({
          entity: "product_attribute",
          fields: ["id", "is_variant_axis"],
          filters: { id: addedAttributeIds },
        }).config({ name: "pc-load-attributes-for-add" })

        const valueLinksToCreate = transform({ buckets }, ({ buckets }) =>
          buckets.attributeAdds.flatMap((a) =>
            a.attribute_value_ids.map<LinkDefinition>((valueId) => ({
              [Modules.PRODUCT]: { product_id: a.product_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: valueId,
              },
            })),
          ),
        )

        createRemoteLinkStep(valueLinksToCreate).config({
          name: "pc-create-attribute-value-links",
        })

        const variantAttrLinksToCreate = transform(
          { buckets, addedAttributes },
          ({ buckets, addedAttributes }) => {
            const variantAxisById = new Map<string, boolean>()
            for (const a of addedAttributes ?? []) {
              variantAxisById.set(
                (a as { id: string }).id,
                Boolean(
                  (a as { is_variant_axis?: boolean }).is_variant_axis,
                ),
              )
            }
            return buckets.attributeAdds
              .filter((a) => variantAxisById.get(a.attribute_id) === true)
              .map<LinkDefinition>((a) => ({
                [Modules.PRODUCT]: { product_id: a.product_id },
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_id: a.attribute_id,
                },
              }))
          },
        )

        createRemoteLinkStep(variantAttrLinksToCreate).config({
          name: "pc-create-variant-attribute-links",
        })

        // Synthesize the corresponding stock product option for each
        // variant-axis attribute add. Mirrors what
        // `addProductAttributeWorkflow` does inline so a confirmed
        // ATTRIBUTE_ADD reaches the same product-options state as a
        // direct attach. Needs the attribute name + value names, which
        // we pull from the freshly-loaded attribute rows.
        const { data: optionAttributes } = useQueryGraphStep({
          entity: "product_attribute",
          fields: ["id", "name", "is_variant_axis", "values.id", "values.name"],
          filters: { id: addedAttributeIds },
        }).config({ name: "pc-load-attribute-values-for-options" })

        const optionsToUpsert = transform(
          { buckets, optionAttributes },
          ({ buckets, optionAttributes }) => {
            const byId = new Map<
              string,
              { name: string; is_variant_axis: boolean; values: Array<{ id: string; name: string }> }
            >()
            for (const a of (optionAttributes ?? []) as Array<{
              id: string
              name: string
              is_variant_axis?: boolean
              values?: Array<{ id: string; name: string }>
            }>) {
              byId.set(a.id, {
                name: a.name,
                is_variant_axis: Boolean(a.is_variant_axis),
                values: a.values ?? [],
              })
            }
            const out: Array<{ product_id: string; title: string; values: string[] }> = []
            for (const a of buckets.attributeAdds) {
              const meta = byId.get(a.attribute_id)
              if (!meta || !meta.is_variant_axis) continue
              const valueIdSet = new Set(a.attribute_value_ids)
              const valueNames = meta.values
                .filter((v) => valueIdSet.has(v.id))
                .map((v) => v.name)
              if (!valueNames.length) continue
              out.push({
                product_id: a.product_id,
                title: meta.name,
                values: valueNames,
              })
            }
            return out
          },
        )

        upsertProductOptionsForAxisStep(optionsToUpsert)
      },
    )

    when(
      { buckets },
      ({ buckets }) => buckets.productsToDelete.length > 0,
    ).then(() => {
      deleteProductsWorkflow.runAsStep({
        input: transform({ buckets }, ({ buckets }) => ({
          ids: buckets.productsToDelete,
        })),
      })
    })

    when(
      { buckets },
      ({ buckets }) => buckets.pendingActionIds.length > 0,
    ).then(() => {
      updateProductChangeActionsStep(
        transform({ buckets }, ({ buckets }) =>
          buckets.pendingActionIds.map((id) => ({ id, applied: true })),
        ),
      )
    })

    return new WorkflowResponse(void 0)
  },
)
