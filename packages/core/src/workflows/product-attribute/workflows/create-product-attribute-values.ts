import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductAttributeValueDTO,
  ProductAttributeValueDTO,
} from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  createProductAttributeValuesStep,
  validateAttributeAcceptsValuesStep,
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

    validateAttributeAcceptsValuesStep({ attribute_id: input.attribute_id })

    const valueInputs = transform({ input }, ({ input }) =>
      input.values.map((v) => ({ ...v, attribute_id: input.attribute_id })),
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
