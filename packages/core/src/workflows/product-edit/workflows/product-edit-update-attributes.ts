import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductChangeActionDTO,
  ProductAttributeInputDTO,
  ProductChangeActionType,
  ProductChangeDTO,
  ProductChangeStatus,
} from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
  validateNoPendingProductChangeStep,
} from "../steps"
import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../../product-attribute/steps"
import { resolveAttributeRefsStep } from "../../product/steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

/**
 * Existing-attribute reference passed by the vendor. `value_ids` are
 * already `ProductAttributeValue` ids; if the caller passed value
 * `values` (names) instead, the route resolves them via
 * `upsertProductAttributeValuesWorkflow` before invoking this flow.
 */
export type ProductEditAttributeAddExistingOperation = {
  type: "add"
  attribute_id: string
  value_ids?: string[]
  values?: string[]
}

/**
 * Inline-create reference — the vendor is creating a product-scoped
 * attribute and its values in the same submission. The attribute and
 * its values are created up-front; the `ProductChangeAction` only
 * stages the *link* between product and value.
 */
export type ProductEditAttributeAddInlineOperation = {
  type: "add"
  attribute_id?: undefined
  name: string
  attribute_type: AttributeType
  values: string[]
  is_variant_axis?: boolean
  is_filterable?: boolean
  is_required?: boolean
  description?: string | null
  metadata?: Record<string, unknown> | null
}

export type ProductEditAttributeRemoveOperation = {
  type: "remove"
  attribute_id: string
}

export type ProductEditAttributeOperation =
  | ProductEditAttributeAddExistingOperation
  | ProductEditAttributeAddInlineOperation
  | ProductEditAttributeRemoveOperation

export type ProductEditUpdateAttributesWorkflowInput = {
  product_id: string
  created_by?: string
  operations: ProductEditAttributeOperation[]
} & AdditionalData

export const productEditUpdateAttributesWorkflowId =
  "product-edit-update-attributes"

/**
 * Vendor "edit product attributes" orchestrator. Supports
 * attach-existing and inline-create on the add path, plus detach on
 * the remove path. Inline-create writes a real product-scoped
 * `ProductAttribute` + values up-front so the staged action can carry
 * pre-resolved `attribute_value_ids` — the dispatcher contract
 * documented in `apply-product-change-actions.ts`. The link between
 * product and value is what gets staged, not the attribute schema.
 */
export const productEditUpdateAttributesWorkflow: ReturnWorkflow<
  ProductEditUpdateAttributesWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditUpdateAttributesWorkflowId,
  function (input: ProductEditUpdateAttributesWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    // Build resolveAttributeRefsStep input. Variant-axis routing is a
    // detail the apply-actions dispatcher handles when creating links
    // — we just need value_id resolution here, so everything goes into
    // `product_attributes`.
    const resolveGroups = transform({ input }, ({ input }) => {
      const refs: ProductAttributeInputDTO[] = []
      for (const op of input.operations ?? []) {
        if (op.type !== "add") continue
        if (op.attribute_id !== undefined) {
          refs.push({
            attribute_id: op.attribute_id,
            value_ids: op.value_ids,
            values: op.values,
          })
        } else {
          refs.push({
            name: op.name,
            type: op.attribute_type,
            values: op.values,
            is_variant_axis: op.is_variant_axis,
            is_filterable: op.is_filterable,
            is_required: op.is_required,
            description: op.description ?? undefined,
            metadata: op.metadata ?? undefined,
          })
        }
      }
      return [{ product_attributes: refs }]
    })

    const resolved = resolveAttributeRefsStep({ groups: resolveGroups })

    const inlineAttrInput = transform(
      { input, resolved },
      ({ input, resolved }) => {
        const inlines = resolved[0]?.inline_product ?? []
        return inlines.map((i) => ({
          product_id: input.product_id,
          name: i.name,
          type: i.type,
          is_variant_axis: i.is_variant_axis,
          is_filterable: i.is_filterable ?? false,
          is_required: i.is_required ?? false,
          description: i.description ?? null,
          metadata: i.metadata ?? null,
        }))
      },
    )

    const createdInlineAttrs = createProductAttributesStep(inlineAttrInput)

    const inlineValuesInput = transform(
      { resolved, createdInlineAttrs },
      ({ resolved, createdInlineAttrs }) => {
        const inlines = resolved[0]?.inline_product ?? []
        const out: Array<{ name: string; attribute_id: string }> = []
        inlines.forEach((inline, idx) => {
          const attribute_id = createdInlineAttrs[idx]?.id as string | undefined
          if (!attribute_id) return
          for (const name of inline.values ?? []) {
            out.push({ name, attribute_id })
          }
        })
        return out
      },
    )

    const createdInlineValues = createProductAttributeValuesStep(
      inlineValuesInput,
    )

    const changes = createProductChangesStep(
      transform({ input }, ({ input }) => [
        {
          product_id: input.product_id,
          created_by: input.created_by,
          status: ProductChangeStatus.PENDING,
        },
      ]),
    )

    const actions = transform(
      { input, resolved, createdInlineAttrs, createdInlineValues, changes },
      ({
        input,
        resolved,
        createdInlineAttrs,
        createdInlineValues,
        changes,
      }) => {
        const changeId = changes[0]?.id as string
        const acts: CreateProductChangeActionDTO[] = []

        const existing = resolved[0]?.existing_product ?? []
        const inlines = resolved[0]?.inline_product ?? []

        for (const r of existing) {
          if (!r.value_ids.length) continue
          acts.push({
            product_change_id: changeId,
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute_id: r.attribute_id,
              attribute_value_ids: r.value_ids,
            },
          })
        }

        const valuesByAttrId = new Map<string, string[]>()
        for (const v of createdInlineValues ?? []) {
          const aid = (v as { attribute_id?: string }).attribute_id
          if (!aid) continue
          const list = valuesByAttrId.get(aid) ?? []
          list.push((v as { id: string }).id)
          valuesByAttrId.set(aid, list)
        }

        inlines.forEach((_inline, idx) => {
          const attr = createdInlineAttrs[idx]
          const attributeId = (attr as { id?: string } | undefined)?.id
          if (!attributeId) return
          const valueIds = valuesByAttrId.get(attributeId) ?? []
          if (!valueIds.length) return
          acts.push({
            product_change_id: changeId,
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute_id: attributeId,
              attribute_value_ids: valueIds,
            },
          })
        })

        for (const op of input.operations ?? []) {
          if (op.type !== "remove") continue
          acts.push({
            product_change_id: changeId,
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_REMOVE,
            details: { attribute_id: op.attribute_id },
          })
        }

        return acts
      },
    )

    createProductChangeActionsStep(actions)

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CREATED,
      data: transform({ changes }, ({ changes }) => ({
        id: changes[0]?.id,
      })),
    })

    autoConfirmProductChangeWorkflow.runAsStep({
      input: transform({ changes, input }, ({ changes, input }) => ({
        change_id: changes[0]?.id as string,
        confirmed_by: input.created_by,
      })),
    })

    return new WorkflowResponse(
      transform({ changes }, ({ changes }) => changes[0] as ProductChangeDTO),
    )
  },
)
