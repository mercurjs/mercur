import { LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { syncProductAttributeOptionsWorkflow } from "../../product-attribute/workflows/sync-product-attribute-options"

export type ApplyProductAttributeChangeActionsWorkflowInput = {
  add_actions: Array<{
    product_id: string
    attribute_id: string
    attribute_value_ids: string[]
  }>
  remove_actions: Array<{
    product_id: string
    attribute_id: string
  }>
}

export const applyProductAttributeChangeActionsWorkflowId =
  "apply-product-attribute-change-actions"

/**
 * Per-bucket dispatcher for `ATTRIBUTE_ADD` / `ATTRIBUTE_REMOVE`
 * actions surfaced by `applyProductChangeActionsWorkflow`. Extracted
 * so the parent dispatcher stays a thin orchestrator and the
 * attribute-attach/detach symmetry lives in one place (mirroring
 * `addProductAttributeWorkflow` + `detachProductAttributeWorkflow`).
 *
 * Removes happen before adds so a single change can re-link the same
 * attribute with a different value set in one round-trip.
 */
export const applyProductAttributeChangeActionsWorkflow = createWorkflow(
  applyProductAttributeChangeActionsWorkflowId,
  function (input: ApplyProductAttributeChangeActionsWorkflowInput) {
    when({ input }, ({ input }) => input.remove_actions.length > 0).then(() => {
      const removedAttributeIds = transform({ input }, ({ input }) =>
        Array.from(
          new Set(input.remove_actions.map((r) => r.attribute_id)),
        ),
      )

      const { data: valuesForRemoval } = useQueryGraphStep({
        entity: "product_attribute_value",
        fields: ["id", "attribute.id"],
        filters: { attribute_id: removedAttributeIds },
      }).config({ name: "pa-apply-load-attribute-values-for-removal" })

      const valueLinksToDismiss = transform(
        { input, valuesForRemoval },
        ({ input, valuesForRemoval }) => {
          const valuesByAttr = new Map<string, string[]>()
          for (const v of valuesForRemoval ?? []) {
            const attrId = (v as { attribute?: { id?: string } }).attribute?.id
            if (!attrId) continue
            const list = valuesByAttr.get(attrId) ?? []
            list.push((v as { id: string }).id)
            valuesByAttr.set(attrId, list)
          }
          const links: LinkDefinition[] = []
          for (const r of input.remove_actions) {
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
        name: "pa-apply-dismiss-attribute-value-links",
      })

      const variantAttrLinksToDismiss = transform(
        { input },
        ({ input }) =>
          input.remove_actions.map<LinkDefinition>((r) => ({
            [Modules.PRODUCT]: { product_id: r.product_id },
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_id: r.attribute_id,
            },
          })),
      )

      dismissRemoteLinkStep(variantAttrLinksToDismiss).config({
        name: "pa-apply-dismiss-variant-attribute-links",
      })
    })

    when({ input }, ({ input }) => input.add_actions.length > 0).then(() => {
      const addedAttributeIds = transform({ input }, ({ input }) =>
        Array.from(new Set(input.add_actions.map((a) => a.attribute_id))),
      )

      const { data: addedAttributes } = useQueryGraphStep({
        entity: "product_attribute",
        fields: ["id", "name", "is_variant_axis", "values.id", "values.name"],
        filters: { id: addedAttributeIds },
      }).config({ name: "pa-apply-load-attributes-for-add" })

      const valueLinksToCreate = transform({ input }, ({ input }) =>
        input.add_actions.flatMap((a) =>
          a.attribute_value_ids.map<LinkDefinition>((valueId) => ({
            [Modules.PRODUCT]: { product_id: a.product_id },
            [MercurModules.PRODUCT_ATTRIBUTE]: {
              product_attribute_value_id: valueId,
            },
          })),
        ),
      )

      createRemoteLinkStep(valueLinksToCreate).config({
        name: "pa-apply-create-attribute-value-links",
      })

      const variantAttrLinksToCreate = transform(
        { input, addedAttributes },
        ({ input, addedAttributes }) => {
          const variantAxisById = new Map<string, boolean>()
          for (const a of addedAttributes ?? []) {
            variantAxisById.set(
              (a as { id: string }).id,
              Boolean((a as { is_variant_axis?: boolean }).is_variant_axis),
            )
          }
          return input.add_actions
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
        name: "pa-apply-create-variant-attribute-links",
      })

      // Synthesize the corresponding stock product option for each
      // variant-axis attribute add. Mirrors what
      // `addProductAttributeWorkflow` does inline so a confirmed
      // ATTRIBUTE_ADD reaches the same product-options state as a
      // direct attach.
      const optionsToUpsert = transform(
        { input, addedAttributes },
        ({ input, addedAttributes }) => {
          const byId = new Map<
            string,
            {
              name: string
              is_variant_axis: boolean
              values: Array<{ id: string; name: string }>
            }
          >()
          for (const a of (addedAttributes ?? []) as Array<{
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
          const out: Array<{
            product_id: string
            title: string
            values: string[]
          }> = []
          for (const a of input.add_actions) {
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

      syncProductAttributeOptionsWorkflow.runAsStep({
        input: transform({ optionsToUpsert }, ({ optionsToUpsert }) => ({
          upsert: optionsToUpsert,
        })),
      })
    })

    return new WorkflowResponse(void 0)
  },
)
