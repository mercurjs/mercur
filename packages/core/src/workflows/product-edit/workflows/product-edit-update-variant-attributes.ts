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
  AttributeScope,
  AttributeType,
  CreateProductChangeActionDTO,
  ProductAttributeBatchUpdate,
  ProductAttributeDTO,
  ProductAttributeValueSnapshot,
  ProductChangeActionType,
  ProductChangeDTO,
  VariantAttributeBatchAdd,
} from "@mercurjs/types"

import {
  SCALAR_VALUE_TYPES,
  validateProductAttributesNotInternalStep,
  validateProductAttributesScopeStep,
  validateProductAttributeValuesStep,
} from "../../product-attribute/steps"
import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditUpdateVariantAttributesWorkflowInput = {
  product_id: string
  variant_id: string
  created_by?: string
  add?: VariantAttributeBatchAdd[]
  remove?: string[]
  update?: ProductAttributeBatchUpdate[]
} & AdditionalData

export type ProductEditUpdateVariantAttributesWorkflowHooks = [
  Hook<
    "validate",
    { input: ProductEditUpdateVariantAttributesWorkflowInput },
    unknown
  >,
  Hook<
    "productChangeCreated",
    {
      product_change: ProductChangeDTO
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const productEditUpdateVariantAttributesWorkflowId =
  "product-edit-update-variant-attributes"

type JoinRow = {
  id: string
  value?: {
    id: string
    name?: string
    attribute_id: string
    attribute?: { type?: AttributeType }
  } | null
}

const SCALAR_TYPES = [
  AttributeType.TEXT,
  AttributeType.UNIT,
  AttributeType.DATE,
  AttributeType.TOGGLE,
]

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

export const productEditUpdateVariantAttributesWorkflow: ReturnWorkflow<
  ProductEditUpdateVariantAttributesWorkflowInput,
  ProductChangeDTO,
  ProductEditUpdateVariantAttributesWorkflowHooks
> = createWorkflow(
  productEditUpdateVariantAttributesWorkflowId,
  function (input: ProductEditUpdateVariantAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
        created_by: input.created_by,
      })),
    )

    const requestedIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set([
          ...(input.add ?? []).map((ref) => ref.id),
          ...(input.update ?? []).map((ref) => ref.id),
          ...(input.remove ?? []),
        ]),
      ),
    )

    const { data: touchedAttributes } = useQueryGraphStep({
      entity: "product_attribute",
      fields: ["id", "name", "type", "scope", "validation", "is_internal"],
      filters: { id: requestedIds },
    }).config({ name: "load-touched-variant-attributes" })

    validateProductAttributesScopeStep(
      transform(
        { requestedIds, touchedAttributes },
        ({ requestedIds, touchedAttributes }) => ({
          expected: AttributeScope.VARIANT,
          requested_ids: requestedIds,
          attributes: (touchedAttributes as ProductAttributeDTO[]).map((a) => ({
            id: a.id,
            name: a.name,
            scope: a.scope,
          })),
        }),
      ),
    )

    validateProductAttributesNotInternalStep(
      transform({ touchedAttributes }, ({ touchedAttributes }) =>
        (touchedAttributes as ProductAttributeDTO[]).map((a) => ({
          id: a.id,
          name: a.name,
          is_internal: a.is_internal,
        })),
      ),
    )

    validateProductAttributeValuesStep(
      transform(
        { input, touchedAttributes },
        ({ input, touchedAttributes }) => {
          const attrsById = new Map(
            (touchedAttributes as ProductAttributeDTO[]).map((a) => [a.id, a]),
          )
          return [...(input.add ?? []), ...(input.update ?? [])].flatMap(
            (ref) => {
              const attr = attrsById.get(ref.id)
              if (
                ref.value === undefined ||
                !attr ||
                !SCALAR_VALUE_TYPES.includes(attr.type)
              ) {
                return []
              }
              return [
                {
                  name: attr.name,
                  type: attr.type,
                  validation: attr.validation,
                  value: ref.value,
                },
              ]
            },
          )
        },
      ),
    )

    const { data: currentRows } = useQueryGraphStep({
      entity: "product_variant_attribute_value",
      fields: [
        "id",
        "value.id",
        "value.name",
        "value.attribute_id",
        "value.attribute.type",
      ],
      filters: transform({ input }, ({ input }) => ({
        variant_id: input.variant_id,
      })),
    }).config({ name: "load-current-variant-attributes-for-diff" })

    const actions = transform(
      { input, currentRows },
      ({ input, currentRows }) => {
        const snapshots = new Map<string, ProductAttributeValueSnapshot>()
        for (const row of (currentRows ?? []) as JoinRow[]) {
          if (!row.value?.attribute_id) continue
          const attributeId = row.value.attribute_id
          const snapshot = snapshots.get(attributeId) ?? {
            attribute_id: attributeId,
            value_ids: [],
            value: null,
          }
          snapshot.value_ids.push(row.value.id)
          const scalar = readScalar(row.value.attribute?.type, row.value.name)
          if (scalar !== null) {
            snapshot.value = scalar
          }
          snapshots.set(attributeId, snapshot)
        }
        for (const snapshot of snapshots.values()) {
          snapshot.value_ids.sort()
        }

        const previousOf = (attributeId: string) =>
          snapshots.get(attributeId) ?? null

        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []
        const base = {
          product_id: input.product_id,
          reference: "product_variant",
          reference_id: input.variant_id,
        }

        for (const attribute of input.add ?? []) {
          const previous = previousOf(attribute.id)
          if (previous) {
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
            ...base,
            action: ProductChangeActionType.VARIANT_ATTRIBUTE_ADD,
            details: {
              variant_id: input.variant_id,
              attribute,
              attribute_id: attribute.id,
              previous_value: previous,
            },
          })
        }

        for (const attribute_id of input.remove ?? []) {
          const previous = previousOf(attribute_id)
          if (!previous) continue
          acts.push({
            ...base,
            action: ProductChangeActionType.VARIANT_ATTRIBUTE_REMOVE,
            details: {
              variant_id: input.variant_id,
              attribute_id,
              previous_value: previous,
            },
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
          const selectionUnchanged =
            update.value_ids === undefined ||
            deepEqualObj(
              [...update.value_ids].sort(),
              previous?.value_ids ?? [],
            )
          if (
            addsNothing &&
            removesNothing &&
            scalarUnchanged &&
            selectionUnchanged
          ) {
            continue
          }
          acts.push({
            ...base,
            action: ProductChangeActionType.VARIANT_ATTRIBUTE_UPDATE,
            details: {
              variant_id: input.variant_id,
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
