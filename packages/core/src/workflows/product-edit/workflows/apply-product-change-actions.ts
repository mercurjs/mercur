import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createProductVariantsWorkflow,
  deleteProductsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  ProductAttributeBatchAdd,
  ProductAttributeBatchUpdate,
  ProductChangeActionType,
} from "@mercurjs/types"

import {
  applyVariantImageLinksStep,
  updateProductChangeActionsStep,
  type VariantImageLinks,
} from "../steps"
import { applyProductAttributeChangeActionsWorkflow } from "./apply-product-attribute-change-actions"

export type ApplyProductChangeActionsWorkflowInput = {
  change_ids: string[]
}

type BucketedActions = {
  productUpdates: Array<Record<string, unknown> & { id: string }>
  variantCreates: Array<Record<string, unknown> & { product_id: string }>
  variantUpdates: Array<Record<string, unknown> & { id: string }>
  variantImageLinks: VariantImageLinks[]
  variantDeletes: string[]
  /**
   * A single reconstructed `ProductAttributeBatchInput` for the change's
   * product, folded from the `ATTRIBUTE_*` actions. A `ProductChange` is
   * per-product and `confirmProductChangeWorkflow` runs per-change, so all
   * attribute actions in one apply share the same `product_id`. `null` when the
   * change carries no attribute actions.
   */
  attributeBatch: {
    product_id: string
    add: ProductAttributeBatchAdd[]
    remove: string[]
    update: ProductAttributeBatchUpdate[]
  } | null
  productsToDelete: string[]
  pendingActionIds: string[]
}

export const applyProductChangeActionsWorkflowId =
  "apply-product-change-actions"

/**
 * Cross-module dispatcher for a confirmed `ProductChange`'s pending
 * actions. Replaces the legacy `ProductModuleService.applyProductChangeActions_`
 * by composing stock Medusa product workflows (update/create/delete
 * variants, update/delete products) with the attribute apply workflow
 * (`applyProductAttributeChangeActionsWorkflow`).
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
 *   5. Attribute add/remove/update — folded into a single per-product
 *      `ProductAttributeBatchInput` and delegated to
 *      `applyProductAttributeChangeActionsWorkflow`, which re-runs the
 *      SPEC-014 batch engine (apply order remove → add → update) so a
 *      single change can re-link the same attribute with a different
 *      value set.
 *   6. Product deletes — last so any audit-trail updates above write
 *      through before the row is soft-deleted.
 *   7. Mark action rows applied.
 *
 * `ATTRIBUTE_*` actions carry the raw batch op verbatim in their
 * `details` JSON (`{ attribute }` / `{ attribute_id }` / `{ update }`),
 * staged by `productEditUpdateAttributesWorkflow`. The batch engine
 * resolves inline-create / find-or-create at confirm time, so no
 * upstream value-id resolution is required.
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
      const variantImageLinks: VariantImageLinks[] = []
      const variantDeletes: string[] = []
      let attributeBatch: BucketedActions["attributeBatch"] = null
      const ensureAttributeBatch = (productId: string) => {
        attributeBatch ??= {
          product_id: productId,
          add: [],
          remove: [],
          update: [],
        }
        return attributeBatch
      }
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
            // `images` is a variant↔image relation, not a scalar column,
            // so split it out of the variant update (which goes through
            // `updateProductVariantsWorkflow`) and apply the link changes
            // separately via `applyVariantImageLinksStep`.
            const { images, ...scalarFields } = fields as {
              images?: { add?: string[]; remove?: string[] }
            } & Record<string, unknown>
            const add = images?.add ?? []
            const remove = images?.remove ?? []
            if (add.length || remove.length) {
              variantImageLinks.push({ variant_id, add, remove })
            }
            if (Object.keys(scalarFields).length) {
              variantUpdates.push({ id: variant_id, ...scalarFields })
            }
            break
          }
          case ProductChangeActionType.VARIANT_REMOVE: {
            const variantId = (details as { variant_id?: string }).variant_id
            if (variantId) variantDeletes.push(variantId)
            break
          }
          case ProductChangeActionType.ATTRIBUTE_ADD: {
            const attribute = (
              details as { attribute?: ProductAttributeBatchAdd }
            ).attribute
            if (!attribute) break
            ensureAttributeBatch(productId).add.push(attribute)
            break
          }
          case ProductChangeActionType.ATTRIBUTE_REMOVE: {
            const attributeId = (details as { attribute_id?: string })
              .attribute_id
            if (!attributeId) break
            ensureAttributeBatch(productId).remove.push(attributeId)
            break
          }
          case ProductChangeActionType.ATTRIBUTE_UPDATE: {
            const update = (
              details as { update?: ProductAttributeBatchUpdate }
            ).update
            if (!update) break
            ensureAttributeBatch(productId).update.push(update)
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
        variantImageLinks,
        variantDeletes,
        attributeBatch,
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

    // Variant media: link/unlink product↔variant images after the
    // variants themselves are stable. Runs last among variant work so the
    // target variants are guaranteed to exist.
    when(
      { buckets },
      ({ buckets }) => buckets.variantImageLinks.length > 0,
    ).then(() => {
      applyVariantImageLinksStep({
        updates: transform(
          { buckets },
          ({ buckets }) => buckets.variantImageLinks,
        ),
      })
    })

    applyProductAttributeChangeActionsWorkflow.runAsStep({
      input: transform({ buckets }, ({ buckets }) => ({
        product_id: buckets.attributeBatch?.product_id ?? "",
        add: buckets.attributeBatch?.add ?? [],
        remove: buckets.attributeBatch?.remove ?? [],
        update: buckets.attributeBatch?.update ?? [],
      })),
    })

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
