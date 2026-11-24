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
  type VariantAttributeJoinRow,
} from "../utils"

export type UpdateVariantAttributesWorkflowInput = VariantAttributeBatchInput &
  AdditionalData

export type UpdateVariantAttributesWorkflowHooks = [
  Hook<"validate", { input: UpdateVariantAttributesWorkflowInput }, unknown>,
  Hook<
    "variantAttributesLinked",
    {
      product_id: string
      variant_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateVariantAttributesWorkflowId = "update-variant-attributes"

/**
 * Applies a remove → add → update attribute batch to a single product variant.
 * Mirrors `createAndLinkProductAttributesToProductWorkflow`, but variant
 * attributes are always shared catalog attributes with `scope: "variant"`, so
 * there is no inline creation and no axis handling: select and toggle values
 * are attached through `product_variant_attribute_value` join rows and scalar
 * types (`text` / `unit` / `date`) get one value row per variant.
 */
export const updateVariantAttributesWorkflow: ReturnWorkflow<
  UpdateVariantAttributesWorkflowInput,
  void,
  UpdateVariantAttributesWorkflowHooks
> = createWorkflow(
  updateVariantAttributesWorkflowId,
  function (input: UpdateVariantAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const requestedIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set([
          ...(input.add ?? []).map((ref) => ref.id),
          ...(input.update ?? []).map((ref) => ref.id),
          ...(input.remove ?? []),
        ]),
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
    }).config({ name: "upd-va-attributes" })

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
        const readd = new Set((input.add ?? []).map((ref) => ref.id))
        const remove = new Set(input.remove ?? [])
        return ((attributesQuery.data ?? []) as ProductAttributeDTO[])
          .filter((a) => remove.has(a.id) && !readd.has(a.id))
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
        return [...(input.add ?? []), ...(input.update ?? [])].flatMap((ref) => {
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
        })
      }),
    )

    const currentQuery = useQueryGraphStep({
      entity: "product_variant_attribute_value",
      filters: { variant_id: input.variant_id },
      fields: [
        "id",
        "variant_id",
        "value_id",
        "value.id",
        "value.name",
        "value.attribute_id",
      ],
    }).config({ name: "upd-va-current" })

    const plan = transform(
      { input, attributesQuery, currentQuery },
      ({ input, attributesQuery, currentQuery }) =>
        planVariantAttributeChanges(
          input,
          new Map(
            ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
              a.id,
              a,
            ]),
          ),
          (currentQuery.data ?? []) as VariantAttributeJoinRow[],
        ),
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

    const joinRows = transform(
      { input, plan, createdValues },
      ({ input, plan, createdValues }) => [
        ...plan.attachValueIds.map((value_id) => ({
          variant_id: input.variant_id,
          value_id,
        })),
        ...((createdValues ?? []) as { id: string }[]).map((v) => ({
          variant_id: input.variant_id,
          value_id: v.id,
        })),
      ],
    )

    when({ joinRows }, ({ joinRows }) => joinRows.length > 0).then(() =>
      createProductVariantAttributeValuesStep(joinRows),
    )

    const variantAttributesLinked = createHook("variantAttributesLinked", {
      product_id: input.product_id,
      variant_id: input.variant_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, variantAttributesLinked],
    })
  },
)
