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
 * Variant fields that are not vendor-editable and must never be staged
 * as part of a `VARIANT_UPDATE`. `manage_inventory` is a marketplace
 * invariant pinned to `false` at variant creation — surfacing it in the
 * request block (as a phantom `Off → On` row) was the core of MER-168.
 */
const NON_EDITABLE_VARIANT_FIELDS = new Set(["manage_inventory"])

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
        // Loaded so an unchanged `options` payload is diffed away rather
        // than re-staged on every edit (MER-168). `options` arrives as a
        // `{ [option_title]: value }` map; rebuild the same shape from these.
        "options.value",
        "options.option.title",
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

        // Mirror the product-level field diff (`product-edit-update-fields`):
        // normalize relation/array shapes to ids/urls before comparing so an
        // unchanged value never produces a spurious change row.
        const normalize = (value: unknown): unknown => {
          if (Array.isArray(value)) {
            return value
              .map((item) => {
                if (item && typeof item === "object" && "id" in item) {
                  return (item as { id: string }).id
                }
                if (item && typeof item === "object" && "url" in item) {
                  return (item as { url: string }).url
                }
                return item
              })
              .sort()
          }
          return value ?? null
        }

        const isEqual = (a: unknown, b: unknown): boolean =>
          JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))

        // Reduce a value to a stable `{ option_title: value }` map for
        // comparison. The proposed payload is already that shape; the
        // current variant carries `options: [{ value, option: { title } }]`.
        const toOptionsMap = (value: unknown): Record<string, string> => {
          const out: Record<string, string> = {}
          if (Array.isArray(value)) {
            for (const entry of value) {
              const title = (entry as { option?: { title?: string } })?.option
                ?.title
              if (title) {
                out[title] = String(
                  (entry as { value?: unknown })?.value ?? "",
                )
              }
            }
          } else if (value && typeof value === "object") {
            for (const [k, v] of Object.entries(
              value as Record<string, unknown>,
            )) {
              out[k] = String(v ?? "")
            }
          }
          return out
        }

        // Order-independent equality for the options map.
        const optionsEqual = (
          a: Record<string, string>,
          b: Record<string, string>,
        ): boolean => {
          const stable = (m: Record<string, string>) =>
            JSON.stringify(
              Object.keys(m)
                .sort()
                .map((k) => [k, m[k]]),
            )
          return stable(a) === stable(b)
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
              const changedFields: Record<string, unknown> = {}
              const previousFields: Record<string, unknown> = {}
              for (const [field, proposedValue] of Object.entries(
                op.fields ?? {},
              )) {
                // Never stage fields the vendor can't edit (e.g.
                // `manage_inventory`).
                if (NON_EDITABLE_VARIANT_FIELDS.has(field)) continue

                // `options` is a relation update (option-title → value
                // pairs). Diff it against the variant's current options so an
                // unchanged map (the form always re-submits it) never surfaces
                // as a phantom change row (MER-168). Forward the proposed map
                // verbatim when it actually differs so the apply step can
                // re-pair variant options.
                if (field === "options") {
                  if (proposedValue === undefined) continue
                  const currentOptions = toOptionsMap(current.options)
                  if (optionsEqual(currentOptions, toOptionsMap(proposedValue)))
                    continue
                  changedFields.options = proposedValue
                  previousFields.options = currentOptions
                  continue
                }

                // `images` is a relation (variant↔image links), not a
                // scalar column we load for diffing. Forward it untouched
                // so the apply step can reconcile the links; it carries no
                // meaningful previous value and stays out of the preview.
                if (field === "images") {
                  if (proposedValue !== undefined) {
                    changedFields.images = proposedValue
                  }
                  continue
                }

                // Skip fields that did not actually change.
                if (isEqual(current[field], proposedValue)) continue

                changedFields[field] = proposedValue
                previousFields[field] = current[field] ?? null
              }

              // Nothing editable changed — don't stage an empty action.
              if (!Object.keys(changedFields).length) break

              acts.push({
                product_id: input.product_id,
                action: ProductChangeActionType.VARIANT_UPDATE,
                details: {
                  variant_id: op.variant_id,
                  fields: changedFields,
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
