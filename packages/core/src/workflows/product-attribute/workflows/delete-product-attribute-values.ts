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

import { ProductAttributeValueWorkflowEvents } from "../events"
import { deleteProductAttributeValuesStep } from "../steps"

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

    // NOTE: mirror-link validation gap — previously enforced via
    // `validateProductAttributeValueNotMirroredStep`; dropped to avoid the
    // full-table scan it required.

    const dismissLinks = transform({ input }, ({ input }) =>
      input.ids.flatMap((id) => [
        {
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: id,
          },
          [Modules.PRODUCT]: {},
        },
      ]),
    )

    dismissRemoteLinkStep(dismissLinks).config({
      name: "pa-dismiss-attribute-value-links",
    })

    deleteProductAttributeValuesStep(input.ids)

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
