import { Modules } from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  dismissRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import {
  deleteProductAttributesStep,
  validateProductAttributeNotMirroredStep,
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

    validateProductAttributeNotMirroredStep({ ids: input.ids })

    const dismissLinks = transform({ input }, ({ input }) =>
      input.ids.flatMap((id) => [
        {
          [MercurModules.PRODUCT_ATTRIBUTE]: { product_attribute_id: id },
          [Modules.PRODUCT]: {},
        },
      ]),
    )

    dismissRemoteLinkStep(dismissLinks).config({
      name: "pa-dismiss-attribute-links",
    })

    deleteProductAttributesStep(input.ids)

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
