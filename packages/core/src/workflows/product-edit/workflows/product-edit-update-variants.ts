import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductChangeActionDTO,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditVariantAddOperation = {
  type: "add"
  variant: Record<string, unknown>
}

export type ProductEditVariantUpdateOperation = {
  type: "update"
  variant_id: string
  fields: Record<string, unknown>
}

export type ProductEditVariantRemoveOperation = {
  type: "remove"
  variant_id: string
}

export type ProductEditVariantOperation =
  | ProductEditVariantAddOperation
  | ProductEditVariantUpdateOperation
  | ProductEditVariantRemoveOperation

export type ProductEditUpdateVariantsWorkflowInput = {
  product_id: string
  created_by?: string
  operations: ProductEditVariantOperation[]
} & AdditionalData

export const productEditUpdateVariantsWorkflowId =
  "product-edit-update-variants"

/**
 * Vendor "edit product variants" orchestrator. Translates each
 * `operations[]` entry into a `VARIANT_ADD` / `VARIANT_UPDATE` /
 * `VARIANT_REMOVE` action on a fresh `ProductChange` via
 * `stageProductChangeWorkflow`. Reusing this single workflow for all
 * three verbs keeps `/vendor/products/:id/variants[...]` routes thin
 * and lets `applyProductChangeActionsWorkflow` do its dependency-
 * ordered dispatch (deletes before creates before updates) without
 * the route having to know about it.
 */
export const productEditUpdateVariantsWorkflow: ReturnWorkflow<
  ProductEditUpdateVariantsWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditUpdateVariantsWorkflowId,
  function (input: ProductEditUpdateVariantsWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    // Load current variants for the product so `VARIANT_UPDATE`
    // actions can carry `previous_fields` alongside the proposed
    // `fields`. The diff panel uses this for the strikethrough
    // before/after render.
    const variantIdsToLoad = transform({ input }, ({ input }) =>
      Array.from(
        new Set(
          (input.operations ?? [])
            .filter(
              (
                op,
              ): op is {
                type: "update"
                variant_id: string
                fields: Record<string, unknown>
              } => op.type === "update",
            )
            .map((op) => op.variant_id),
        ),
      ),
    )

    const { data: currentVariants } = useQueryGraphStep({
      entity: "variant",
      fields: [
        "id",
        "title",
        "sku",
        "ean",
        "upc",
        "isbn",
        "barcode",
        "hs_code",
        "mid_code",
        "manage_inventory",
        "allow_backorder",
        "weight",
        "length",
        "height",
        "width",
        "origin_country",
        "material",
        "variant_rank",
        "metadata",
      ],
      filters: { id: variantIdsToLoad },
    }).config({ name: "pc-load-variants-for-diff" })

    const actions = transform(
      { input, currentVariants },
      ({ input, currentVariants }) => {
        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        const currentVariantsById = new Map<
          string,
          Record<string, unknown>
        >()
        for (const v of (currentVariants ?? []) as Array<
          Record<string, unknown> & { id: string }
        >) {
          currentVariantsById.set(v.id, v)
        }

        for (const op of input.operations ?? []) {
          switch (op.type) {
            case "add":
              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_ADD,
                details: { variant: op.variant },
              })
              break
            case "update": {
              const current = currentVariantsById.get(op.variant_id) ?? {}
              const previousFields: Record<string, unknown> = {}
              for (const field of Object.keys(op.fields ?? {})) {
                previousFields[field] = current[field] ?? null
              }
              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_UPDATE,
                details: {
                  variant_id: op.variant_id,
                  fields: op.fields,
                  previous_fields: previousFields,
                },
              })
              break
            }
            case "remove":
              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_REMOVE,
                details: { variant_id: op.variant_id },
              })
              break
          }
        }

        return acts
      },
    )

    const change = stageProductChangeWorkflow.runAsStep({
      input: transform({ input, actions }, ({ input, actions }) => ({
        product_id: input.product_id,
        created_by: input.created_by,
        actions,
      })),
    })

    return new WorkflowResponse(change)
  },
)
