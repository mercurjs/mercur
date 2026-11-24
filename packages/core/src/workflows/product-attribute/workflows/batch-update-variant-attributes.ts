import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  AttributeScope,
  ProductAttributeDTO,
  VariantAttributeBatchInput,
} from "@mercurjs/types"

import {
  createProductAttributeValuesStep,
  createProductVariantAttributeValuesStep,
  deleteProductAttributeValuesStep,
  deleteProductVariantAttributeValuesStep,
  SCALAR_VALUE_TYPES,
  updateProductAttributeValuesStep,
  validateProductAttributesNotRequiredStep,
  validateProductAttributesScopeStep,
  validateProductAttributeValuesStep,
} from "../steps"
import {
  planVariantAttributeChanges,
  type VariantAttributeChangePlan,
  type VariantAttributeJoinRow,
} from "../utils"

export type BatchUpdateVariantAttributesWorkflowInput = {
  variants: VariantAttributeBatchInput[]
} & AdditionalData

export type BatchUpdateVariantAttributesWorkflowHooks = [
  Hook<
    "validate",
    { input: BatchUpdateVariantAttributesWorkflowInput },
    unknown
  >,
  Hook<
    "variantAttributesLinked",
    {
      variants: { product_id: string; variant_id: string }[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const batchUpdateVariantAttributesWorkflowId =
  "batch-update-variant-attributes"

/**
 * `updateVariantAttributesWorkflow` for many variants at once, one entry per variant. The
 * attributes and the variants' current values are read once and every write step runs once, so
 * the whole batch applies or none of it does.
 */
export const batchUpdateVariantAttributesWorkflow: ReturnWorkflow<
  BatchUpdateVariantAttributesWorkflowInput,
  void,
  BatchUpdateVariantAttributesWorkflowHooks
> = createWorkflow(
  batchUpdateVariantAttributesWorkflowId,
  function (input: BatchUpdateVariantAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const requestedIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set(
          input.variants.flatMap((variant) => [
            ...(variant.add ?? []).map((ref) => ref.id),
            ...(variant.update ?? []).map((ref) => ref.id),
            ...(variant.remove ?? []),
          ]),
        ),
      ),
    )

    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: requestedIds },
      fields: [
        "id",
        "name",
        "type",
        "scope",
        "is_required",
        "validation",
        "values.id",
        "values.name",
      ],
    }).config({ name: "batch-upd-va-attributes" })

    validateProductAttributesScopeStep(
      transform(
        { requestedIds, attributesQuery },
        ({ requestedIds, attributesQuery }) => ({
          expected: AttributeScope.VARIANT,
          requested_ids: requestedIds,
          attributes: ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map(
            (a) => ({ id: a.id, name: a.name, scope: a.scope }),
          ),
        }),
      ),
    )

    validateProductAttributesNotRequiredStep(
      transform({ input, attributesQuery }, ({ input, attributesQuery }) => {
        const attrs = (attributesQuery.data ?? []) as ProductAttributeDTO[]
        const dropped = new Set<string>()
        for (const variant of input.variants) {
          const readd = new Set((variant.add ?? []).map((ref) => ref.id))
          for (const id of variant.remove ?? []) {
            if (!readd.has(id)) dropped.add(id)
          }
        }
        return attrs
          .filter((a) => dropped.has(a.id))
          .map((a) => ({ id: a.id, name: a.name, is_required: !!a.is_required }))
      }),
    )

    validateProductAttributeValuesStep(
      transform({ input, attributesQuery }, ({ input, attributesQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        return input.variants.flatMap((variant) =>
          [...(variant.add ?? []), ...(variant.update ?? [])].flatMap((ref) => {
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
          }),
        )
      }),
    )

    const currentQuery = useQueryGraphStep({
      entity: "product_variant_attribute_value",
      filters: {
        variant_id: transform({ input }, ({ input }) =>
          input.variants.map((variant) => variant.variant_id),
        ),
      },
      fields: [
        "id",
        "variant_id",
        "value_id",
        "value.id",
        "value.name",
        "value.attribute_id",
      ],
    }).config({ name: "batch-upd-va-current" })

    const plan = transform(
      { input, attributesQuery, currentQuery },
      ({ input, attributesQuery, currentQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const current = (currentQuery.data ?? []) as VariantAttributeJoinRow[]

        const merged: VariantAttributeChangePlan & {
          attachRows: { variant_id: string; value_id: string }[]
          newValueVariantIds: string[]
        } = {
          deleteJoinIds: [],
          deleteValueIds: [],
          attachValueIds: [],
          newValueRows: [],
          renameValueRows: [],
          attachRows: [],
          newValueVariantIds: [],
        }

        for (const variant of input.variants) {
          const own = planVariantAttributeChanges(
            variant,
            attrsById,
            current.filter((row) => row.variant_id === variant.variant_id),
          )
          merged.deleteJoinIds.push(...own.deleteJoinIds)
          merged.deleteValueIds.push(...own.deleteValueIds)
          merged.renameValueRows.push(...own.renameValueRows)
          merged.newValueRows.push(...own.newValueRows)
          merged.newValueVariantIds.push(
            ...own.newValueRows.map(() => variant.variant_id),
          )
          merged.attachRows.push(
            ...own.attachValueIds.map((value_id) => ({
              variant_id: variant.variant_id,
              value_id,
            })),
          )
        }

        return merged
      },
    )

    when({ plan }, ({ plan }) => plan.deleteJoinIds.length > 0).then(() =>
      deleteProductVariantAttributeValuesStep(plan.deleteJoinIds),
    )

    when({ plan }, ({ plan }) => plan.deleteValueIds.length > 0).then(() =>
      deleteProductAttributeValuesStep(plan.deleteValueIds),
    )

    when({ plan }, ({ plan }) => plan.renameValueRows.length > 0).then(() =>
      updateProductAttributeValuesStep({ values: plan.renameValueRows }),
    )

    const createdValues = createProductAttributeValuesStep(plan.newValueRows)

    // Created values come back in input order, which is how each one finds its variant.
    const joinRows = transform(
      { plan, createdValues },
      ({ plan, createdValues }) => [
        ...plan.attachRows,
        ...((createdValues ?? []) as { id: string }[]).map((v, index) => ({
          variant_id: plan.newValueVariantIds[index],
          value_id: v.id,
        })),
      ],
    )

    when({ joinRows }, ({ joinRows }) => joinRows.length > 0).then(() =>
      createProductVariantAttributeValuesStep(joinRows),
    )

    const variantAttributesLinked = createHook("variantAttributesLinked", {
      variants: transform({ input }, ({ input }) =>
        input.variants.map((variant) => ({
          product_id: variant.product_id,
          variant_id: variant.variant_id,
        })),
      ),
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, variantAttributesLinked],
    })
  },
)
