import { AdditionalData } from "@medusajs/framework/types"
import { deepEqualObj } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  type Hook,
  type ReturnWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductChangeActionDTO,
  ProductAttributeBatchAdd,
  ProductAttributeBatchUpdate,
  ProductAttributeValueSnapshot,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditUpdateAttributesWorkflowInput = {
  product_id: string
  created_by?: string
  add?: ProductAttributeBatchAdd[]
  remove?: string[]
  update?: ProductAttributeBatchUpdate[]
} & AdditionalData

export type ProductEditUpdateAttributesWorkflowHooks = [
  Hook<"validate", { input: ProductEditUpdateAttributesWorkflowInput }, unknown>,
  Hook<
    "productChangeCreated",
    {
      product_change: ProductChangeDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const productEditUpdateAttributesWorkflowId =
  "product-edit-update-attributes"

type LinkedValue = {
  id: string
  name?: string
  attribute?: { id?: string; type?: AttributeType }
}

const SCALAR_TYPES = [
  AttributeType.TEXT,
  AttributeType.UNIT,
  AttributeType.TOGGLE,
]

/**
 * `text` / `unit` / `toggle` selections are stored as a linked value row whose
 * `name` carries the scalar, so the scalar is read back off the link.
 */
const readScalar = (
  type: AttributeType | undefined,
  name: string | undefined,
): string | number | boolean | null => {
  if (!type || !SCALAR_TYPES.includes(type) || name === undefined) {
    return null
  }
  if (type === AttributeType.TOGGLE) {
    return name === "true"
  }
  return name
}

export const productEditUpdateAttributesWorkflow: ReturnWorkflow<
  ProductEditUpdateAttributesWorkflowInput,
  ProductChangeDTO,
  ProductEditUpdateAttributesWorkflowHooks
> = createWorkflow(
  productEditUpdateAttributesWorkflowId,
  function (input: ProductEditUpdateAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
        created_by: input.created_by,
      })),
    )

    const { data: currentProducts } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id",
        "product_attribute_values.id",
        "product_attribute_values.name",
        "product_attribute_values.attribute.id",
        "product_attribute_values.attribute.type",
      ],
      filters: transform({ input }, ({ input }) => ({ id: input.product_id })),
    }).config({ name: "load-current-attributes-for-diff" })

    const actions = transform(
      { input, currentProducts },
      ({ input, currentProducts }) => {
        const linked = (
          (currentProducts?.[0]?.product_attribute_values ?? []) as LinkedValue[]
        ).filter((value) => value?.attribute?.id)

        const snapshots = new Map<string, ProductAttributeValueSnapshot>()
        for (const value of linked) {
          const attributeId = value.attribute!.id!
          const snapshot = snapshots.get(attributeId) ?? {
            attribute_id: attributeId,
            value_ids: [],
            value: null,
          }
          snapshot.value_ids.push(value.id)
          const scalar = readScalar(value.attribute!.type, value.name)
          if (scalar !== null) {
            snapshot.value = scalar
          }
          snapshots.set(attributeId, snapshot)
        }
        for (const snapshot of snapshots.values()) {
          snapshot.value_ids.sort()
        }

        const previousOf = (
          attributeId: string | null,
        ): ProductAttributeValueSnapshot | null =>
          attributeId ? (snapshots.get(attributeId) ?? null) : null

        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        for (const attribute of input.add ?? []) {
          const attributeId = "id" in attribute ? attribute.id : null
          const previous = previousOf(attributeId)

          // An add whose selection the product already holds changes nothing.
          if (previous && "id" in attribute) {
            const proposedIds = [...(attribute.value_ids ?? [])].sort()
            const sameIds =
              proposedIds.length > 0 &&
              deepEqualObj(proposedIds, previous.value_ids)
            const sameScalar =
              attribute.value !== undefined &&
              deepEqualObj(attribute.value, previous.value)
            if (sameIds || sameScalar) continue
          }

          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute,
              attribute_id: attributeId,
              previous_value: previous,
            },
          })
        }

        for (const attribute_id of input.remove ?? []) {
          const previous = previousOf(attribute_id)
          // Removing something the product does not hold changes nothing.
          if (!previous) continue

          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_REMOVE,
            details: { attribute_id, previous_value: previous },
          })
        }

        for (const update of input.update ?? []) {
          const previous = previousOf(update.id)
          const currentIds = new Set(previous?.value_ids ?? [])

          const addsNothing = (update.add ?? []).every(
            (entry) => typeof entry === "string" && currentIds.has(entry),
          )
          const removesNothing = (update.remove ?? []).every(
            (entry) => !currentIds.has(entry),
          )
          const scalarUnchanged =
            update.value === undefined ||
            deepEqualObj(update.value, previous?.value ?? null)

          if (
            addsNothing &&
            removesNothing &&
            scalarUnchanged &&
            update.title === undefined
          ) {
            continue
          }

          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_UPDATE,
            details: {
              update,
              attribute_id: update.id,
              value: update.value,
              previous_value: previous,
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

    const productChangeCreated = createHook("productChangeCreated", {
      product_change: change,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(change, {
      hooks: [validate, productChangeCreated],
    })
  },
)
