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
import {
  AttributeType,
  ProductAttributeValueDTO,
  UpdateProductAttributeValueDTO,
} from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  updateProductAttributeValuesStep,
} from "../steps"

export type UpdateProductAttributeValuesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeValueDTO
} & AdditionalData

export type UpdateProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: UpdateProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesUpdated",
    {
      values: ProductAttributeValueDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductAttributeValuesWorkflowId =
  "update-product-attribute-values"

export const updateProductAttributeValuesWorkflow: ReturnWorkflow<
  UpdateProductAttributeValuesWorkflowInput,
  ProductAttributeValueDTO[],
  UpdateProductAttributeValuesWorkflowHooks
> = createWorkflow(
  updateProductAttributeValuesWorkflowId,
  function (input: UpdateProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    const values = updateProductAttributeValuesStep({
      selector: input.selector,
      update: input.update,
    })

    const attributeFilter = transform({ values }, ({ values }) => ({
      ids: Array.from(new Set(values.map((v) => v.attribute_id))),
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
    })

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

    when({ optionValuesSync }, ({ optionValuesSync }) => optionValuesSync.should)
      .then(() => updateProductOptionsStep(optionValuesSync.stepInput))

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id })),
      ),
    })

    const productAttributeValuesUpdated = createHook(
      "productAttributeValuesUpdated",
      {
        values,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(values as ProductAttributeValueDTO[], {
      hooks: [validate, productAttributeValuesUpdated],
    })
  },
)
