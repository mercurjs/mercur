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
import {
  emitEventStep,
  updateProductOptionsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { AttributeType } from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  deleteProductAttributeValuesStep,
} from "../steps"

export type DeleteProductAttributeValuesWorkflowInput = {
  ids: string[]
} & AdditionalData

export type DeleteProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: DeleteProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesDeleted",
    {
      ids: string[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const deleteProductAttributeValuesWorkflowId =
  "delete-product-attribute-values"

export const deleteProductAttributeValuesWorkflow: ReturnWorkflow<
  DeleteProductAttributeValuesWorkflowInput,
  void,
  DeleteProductAttributeValuesWorkflowHooks
> = createWorkflow(
  deleteProductAttributeValuesWorkflowId,
  function (input: DeleteProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    const valuesQuery = useQueryGraphStep({
      entity: "product_attribute_value",
      filters: { id: input.ids },
      fields: ["id", "attribute_id"],
    }).config({ name: "pa-values-to-delete" })

    deleteProductAttributeValuesStep(input.ids)

    const attributeFilter = transform({ valuesQuery }, ({ valuesQuery }) => ({
      ids: Array.from(
        new Set(
          (valuesQuery.data ?? []).map(
            (v: { attribute_id: string }) => v.attribute_id,
          ),
        ),
      ),
    }))

    const attributeQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: attributeFilter.ids },
      fields: [
        "id",
        "type",
        "is_variant_axis",
        "product_option_id",
        "values.name",
      ],
    }).config({ name: "pa-deleted-values-attributes" })

    const optionValuesSync = transform(
      { attributeQuery },
      ({ attributeQuery }) => {
        const attributes = attributeQuery.data ?? []
        const mirrored = attributes.filter(
          (a: {
            type: AttributeType
            is_variant_axis: boolean
            product_option_id: string | null
          }) =>
            a.type === AttributeType.MULTI_SELECT &&
            !!a.is_variant_axis &&
            !!a.product_option_id,
        )
        const target = mirrored.length === 1 ? mirrored[0] : undefined
        return {
          should: !!target,
          stepInput: {
            selector: { id: target?.product_option_id ?? "" },
            update: {
              values: (target?.values ?? []).map(
                (v: { name: string }) => v.name,
              ),
            },
          },
        }
      },
    )

    when(
      { optionValuesSync },
      ({ optionValuesSync }) => optionValuesSync.should,
    ).then(() => updateProductOptionsStep(optionValuesSync.stepInput))

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id })),
      ),
    })

    const productAttributeValuesDeleted = createHook(
      "productAttributeValuesDeleted",
      {
        ids: input.ids,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributeValuesDeleted],
    })
  },
)
