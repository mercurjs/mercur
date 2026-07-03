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
  deleteProductOptionsStep,
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { ProductAttributeWorkflowEvents } from "../events"
import {
  deleteProductAttributesStep,
  validateProductAttributesNotLinkedStep,
} from "../steps"

export type DeleteProductAttributesWorkflowInput = {
  ids: string[]
} & AdditionalData

export type DeleteProductAttributesWorkflowHooks = [
  Hook<"validate", { input: DeleteProductAttributesWorkflowInput }, unknown>,
  Hook<
    "productAttributesDeleted",
    {
      ids: string[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const deleteProductAttributesWorkflowId = "delete-product-attributes"


export const deleteProductAttributesWorkflow: ReturnWorkflow<
  DeleteProductAttributesWorkflowInput,
  void,
  DeleteProductAttributesWorkflowHooks
> = createWorkflow(
  deleteProductAttributesWorkflowId,
  function (input: DeleteProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    validateProductAttributesNotLinkedStep(input.ids)

    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: input.ids },
      fields: ["id", "product_option_id"],
    })

    deleteProductAttributesStep(input.ids)

    const optionIdsToDelete = transform(
      { attributesQuery },
      ({ attributesQuery }) =>
        (attributesQuery.data ?? [])
          .map((a: { product_option_id: string | null }) => a.product_option_id)
          .filter((id: string | null): id is string => !!id),
    )

    when(
      { optionIdsToDelete },
      ({ optionIdsToDelete }) => optionIdsToDelete.length > 0,
    ).then(() => deleteProductOptionsStep(optionIdsToDelete))

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.DELETED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id })),
      ),
    })

    const productAttributesDeleted = createHook("productAttributesDeleted", {
      ids: input.ids,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributesDeleted],
    })
  },
)
