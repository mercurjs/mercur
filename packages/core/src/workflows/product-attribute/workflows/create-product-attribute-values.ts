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
  CreateProductAttributeValueDTO,
  ProductAttributeValueDTO,
} from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  createProductAttributeValuesStep,
} from "../steps"

export type CreateProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: CreateProductAttributeValueDTO[]
} & AdditionalData

export type CreateProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: CreateProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesCreated",
    {
      values: ProductAttributeValueDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductAttributeValuesWorkflowId =
  "create-product-attribute-values"

export const createProductAttributeValuesWorkflow: ReturnWorkflow<
  CreateProductAttributeValuesWorkflowInput,
  ProductAttributeValueDTO[],
  CreateProductAttributeValuesWorkflowHooks
> = createWorkflow(
  createProductAttributeValuesWorkflowId,
  function (input: CreateProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    const attributeQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: input.attribute_id },
      fields: [
        "id",
        "name",
        "type",
        "is_variant_axis",
        "product_option_id",
        "values.name",
      ],
      options: { isList: false },
    })

    const mirroredOption = when(
      { attributeQuery },
      ({ attributeQuery }) => {
        const attribute = attributeQuery.data
        return (
          attribute?.type === AttributeType.MULTI_SELECT &&
          !!attribute?.is_variant_axis &&
          !!attribute?.product_option_id
        )
      },
    ).then(() => {
      const optionUpdate = transform(
        { attributeQuery, input },
        ({ attributeQuery, input }) => {
          const attribute = attributeQuery.data
          const existing = (attribute.values ?? []).map(
            (v: { name: string }) => v.name,
          )
          const incoming = input.values.map((v) => v.name)
          return {
            selector: { id: attribute.product_option_id },
            update: { values: Array.from(new Set([...existing, ...incoming])) },
          }
        },
      )

      return updateProductOptionsStep(optionUpdate)
    })

    const valueInputs = transform(
      { input, mirroredOption },
      ({ input, mirroredOption }) => {
        const option = mirroredOption?.[0]
        const idByValue = new Map<string, string>(
          (option?.values ?? []).map((ov: { id: string; value: string }) => [
            ov.value,
            ov.id,
          ]),
        )
        return input.values.map((v) => ({
          ...v,
          attribute_id: input.attribute_id,
          product_option_value_id: idByValue.get(v.name) ?? null,
        }))
      },
    )

    const values = createProductAttributeValuesStep(valueInputs)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.CREATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id })),
      ),
    })

    const productAttributeValuesCreated = createHook(
      "productAttributeValuesCreated",
      {
        values,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(values as ProductAttributeValueDTO[], {
      hooks: [validate, productAttributeValuesCreated],
    })
  },
)
