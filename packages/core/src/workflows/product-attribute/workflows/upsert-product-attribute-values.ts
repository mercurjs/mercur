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
  ProductAttributeValueDTO,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import { ProductAttributeValueWorkflowEvents } from "../events"
import {
  upsertProductAttributeValuesStep,
  validateAttributeAcceptsValuesStep,
} from "../steps"

export type UpsertProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: UpsertProductAttributeValueDTO[]
} & AdditionalData

export type UpsertProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: UpsertProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesUpserted",
    {
      values: ProductAttributeValueDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const upsertProductAttributeValuesWorkflowId =
  "upsert-product-attribute-values"

export const upsertProductAttributeValuesWorkflow: ReturnWorkflow<
  UpsertProductAttributeValuesWorkflowInput,
  ProductAttributeValueDTO[],
  UpsertProductAttributeValuesWorkflowHooks
> = createWorkflow(
  upsertProductAttributeValuesWorkflowId,
  function (input: UpsertProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    validateAttributeAcceptsValuesStep({ attribute_id: input.attribute_id })

    const valueInputs = transform({ input }, ({ input }) =>
      input.values.map((v) =>
        v.id ? v : { ...v, attribute_id: input.attribute_id },
      ),
    )

    const values = upsertProductAttributeValuesStep(valueInputs)

    emitEventStep({
      eventName: ProductAttributeValueWorkflowEvents.UPDATED,
      data: transform({ values }, ({ values }) =>
        values.map((v) => ({ id: v.id })),
      ),
    })

    const productAttributeValuesUpserted = createHook(
      "productAttributeValuesUpserted",
      {
        values,
        additional_data: input.additional_data,
      },
    )

    return new WorkflowResponse(values as ProductAttributeValueDTO[], {
      hooks: [validate, productAttributeValuesUpserted],
    })
  },
)
