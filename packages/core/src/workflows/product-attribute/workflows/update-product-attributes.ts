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
} from "@medusajs/medusa/core-flows"
import {
  ProductAttributeDTO,
  UpdateProductAttributeDTO,
} from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import {
  updateProductAttributesStep,
} from "../steps"

export type UpdateProductAttributesWorkflowInput = {
  selector: Record<string, unknown>
  update: UpdateProductAttributeDTO
} & AdditionalData

export type UpdateProductAttributesWorkflowHooks = [
  Hook<"validate", { input: UpdateProductAttributesWorkflowInput }, unknown>,
  Hook<
    "productAttributesUpdated",
    {
      attributes: ProductAttributeDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateProductAttributesWorkflowId = "update-product-attributes"

export const updateProductAttributesWorkflow: ReturnWorkflow<
  UpdateProductAttributesWorkflowInput,
  ProductAttributeDTO[],
  UpdateProductAttributesWorkflowHooks
> = createWorkflow(
  updateProductAttributesWorkflowId,
  function (input: UpdateProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const attributes = updateProductAttributesStep({
      selector: input.selector,
      update: input.update,
    })

    const optionTitleSync = transform(
      { input, attributes },
      ({ input, attributes }) => {
        const optionIds = attributes
          .filter((a) => !!a.product_option_id)
          .map((a) => a.product_option_id as string)
        return {
          should: input.update.name !== undefined && optionIds.length > 0,
          stepInput: {
            selector: { id: optionIds },
            update: { title: input.update.name },
          },
        }
      },
    )

    when({ optionTitleSync }, ({ optionTitleSync }) => optionTitleSync.should)
      .then(() => updateProductOptionsStep(optionTitleSync.stepInput))

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.UPDATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id })),
      ),
    })

    const productAttributesUpdated = createHook("productAttributesUpdated", {
      attributes,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(attributes as ProductAttributeDTO[], {
      hooks: [validate, productAttributesUpdated],
    })
  },
)
