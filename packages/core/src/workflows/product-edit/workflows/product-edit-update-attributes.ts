import { AdditionalData } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  AttributeType,
  CreateProductChangeActionDTO,
  ProductAttributeInputDTO,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { materializeProductAttributesWorkflow } from "../../product-attribute/workflows/materialize-product-attributes"
import { buildInlinePlan, resolveAttributeRefsStep } from "../../product/steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

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

    const inlinePlan = transform(
      { input, resolved },
      ({ input, resolved }) =>
        buildInlinePlan(resolved, () => input.product_id),
    )

    // Free-form values (unit/text/toggle) submitted against an existing
    // attribute won't pre-exist in the attribute's preset `values`, so
    // `resolveAttributeRefsStep` leaves them out of `value_ids`.
    // Materialise the unresolved names so the staged action carries
    // resolved ids (the dispatcher contract in
    // `apply-product-change-actions.ts`). Select-type misses are not
    // valid free-form values — surface as NOT_FOUND.
    const freeFormValueInput = transform(
      { input, resolved },
      ({ input, resolved }) => {
        const existing = resolved[0]?.existing_product ?? []

        const requestedByAttrId = new Map<string, string[]>()
        for (const op of input.operations ?? []) {
          if (op.type !== "add") continue
          if (op.attribute_id === undefined) continue
          if (!op.values?.length) continue
          requestedByAttrId.set(op.attribute_id, op.values)
        }

        const out: Array<{ name: string; attribute_id: string }> = []
        for (const ref of existing) {
          const requested = requestedByAttrId.get(ref.attribute_id)
          if (!requested?.length) continue

          const resolvedNames = new Set(ref.value_names)
          const seen = new Set<string>()
          const unresolved: string[] = []
          for (const raw of requested) {
            const name = raw?.trim()
            if (!name) continue
            if (resolvedNames.has(name)) continue
            if (seen.has(name)) continue
            seen.add(name)
            unresolved.push(name)
          }

          if (!unresolved.length) continue

          if (
            ref.attribute_type === AttributeType.SINGLE_SELECT ||
            ref.attribute_type === AttributeType.MULTI_SELECT
          ) {
            throw new MedusaError(
              MedusaError.Types.NOT_FOUND,
              `Product attribute value(s) ${unresolved
                .map((v) => `"${v}"`)
                .join(", ")} not found on attribute ${ref.attribute_id}`,
            )
          }

          for (const name of unresolved) {
            out.push({ name, attribute_id: ref.attribute_id })
          }
        }

        return out
      },
    )

    const materialized = materializeProductAttributesWorkflow.runAsStep({
      input: transform(
        { inlinePlan, freeFormValueInput },
        ({ inlinePlan, freeFormValueInput }) => ({
          plan: inlinePlan,
          free_form_values: freeFormValueInput,
        }),
      ),
    })

    const createdInlineAttrs = transform(
      { materialized },
      ({ materialized }) => materialized.inline_attributes,
    )
    const createdInlineValues = transform(
      { materialized },
      ({ materialized }) => materialized.inline_values,
    )
    const createdFreeFormValues = transform(
      { materialized },
      ({ materialized }) => materialized.free_form_values,
    )

    const actions = transform(
      {
        input,
        resolved,
        createdInlineAttrs,
        createdInlineValues,
        createdFreeFormValues,
      },
      ({
        input,
        resolved,
        createdInlineAttrs,
        createdInlineValues,
        createdFreeFormValues,
      }) => {
        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        const existing = resolved[0]?.existing_product ?? []
        const inlines = resolved[0]?.inline_product ?? []

        const freeFormByAttrId = new Map<string, string[]>()
        for (const v of createdFreeFormValues ?? []) {
          const aid = (v as { attribute_id?: string }).attribute_id
          if (!aid) continue
          const list = freeFormByAttrId.get(aid) ?? []
          list.push((v as { id: string }).id)
          freeFormByAttrId.set(aid, list)
        }

        for (const r of existing) {
          const newIds = freeFormByAttrId.get(r.attribute_id) ?? []
          const allIds = [...r.value_ids, ...newIds]
          if (!allIds.length) continue
          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute_id: r.attribute_id,
              attribute_value_ids: allIds,
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
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_REMOVE,
            details: { attribute_id: op.attribute_id },
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
