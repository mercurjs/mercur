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

export type ProductEditUpdateFieldsWorkflowInput = {
  product_id: string
  created_by?: string
  update: Record<string, unknown>
} & AdditionalData

/**
 * Fields the diff considers — anything outside this list is ignored.
 * Variant and attribute mutations have dedicated workflows that emit
 * `VARIANT_*` / `ATTRIBUTE_*` actions instead of an opaque UPDATE.
 */
const DIFFABLE_FIELDS = [
  "title",
  "subtitle",
  "handle",
  "description",
  "discountable",
  "is_giftcard",
  "thumbnail",
  "images",
  "material",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "mid_code",
  "origin_country",
  "type_id",
  "collection_id",
  "categories",
  "tags",
  "sales_channels",
  "metadata",
] as const

export const productEditUpdateFieldsWorkflowId = "product-edit-update-fields"

/**
 * Vendor "edit product fields" orchestrator. Diffs the proposed
 * payload against the current product, stages one
 * `ProductChangeAction` per changed field (`STATUS_CHANGE` for
 * `status`, `UPDATE { field, value }` for everything else) via
 * `stageProductChangeWorkflow`. The shared building block runs the
 * auto-confirm conditional so the change is applied inline when the
 * marketplace has the `PRODUCT_REQUEST` flag disabled.
 *
 * The dispatcher (`applyProductChangeActionsWorkflow`) collapses all
 * UPDATE actions for the same product into a single
 * `updateProductsWorkflow` call, so emitting field-granular actions
 * still costs one core workflow run.
 */
export const productEditUpdateFieldsWorkflow: ReturnWorkflow<
  ProductEditUpdateFieldsWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditUpdateFieldsWorkflowId,
  function (input: ProductEditUpdateFieldsWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    const { data: currentProducts } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "title",
        "subtitle",
        "handle",
        "description",
        "status",
        "discountable",
        "is_giftcard",
        "thumbnail",
        "material",
        "weight",
        "length",
        "height",
        "width",
        "hs_code",
        "mid_code",
        "origin_country",
        "type_id",
        "collection_id",
        "metadata",
        "images.url",
        "categories.id",
        "tags.id",
        "sales_channels.id",
      ],
      filters: transform({ input }, ({ input }) => ({ id: input.product_id })),
    }).config({ name: "load-current-product-for-diff" })

    const actions = transform(
      { input, currentProducts },
      ({ input, currentProducts }) => {
        const current = (currentProducts?.[0] ?? {}) as Record<string, unknown>
        const proposed = input.update ?? {}

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

        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        if (proposed.status !== undefined) {
          if (!isEqual(current.status, proposed.status)) {
            acts.push({
              product_id: input.product_id,
              action: ProductChangeActionType.STATUS_CHANGE,
              details: {
                status: proposed.status,
                previous_status: current.status,
              },
            })
          }
        }

        for (const field of DIFFABLE_FIELDS) {
          if (!(field in proposed)) continue
          const proposedValue = (proposed as Record<string, unknown>)[field]
          const currentValue = current[field]
          if (isEqual(currentValue, proposedValue)) continue

          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.UPDATE,
            details: {
              field,
              value: proposedValue,
              previous_value: currentValue,
            },
          })
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
