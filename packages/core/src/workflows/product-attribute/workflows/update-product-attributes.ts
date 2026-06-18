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
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  ProductAttributeDTO,
  UpdateProductAttributeDTO,
} from "@mercurjs/types"

import { ProductAttributeWorkflowEvents } from "../events"
import {
  reconcileAxisAttributeMirrorStep,
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

    // SPEC-014 §F: reconcile the option mirror (axis flip-on / title rename).
    const axisMirror = reconcileAxisAttributeMirrorStep(
      transform({ attributes }, ({ attributes }) => ({
        attribute_ids: attributes.map((a) => a.id),
      })),
    )
    createRemoteLinkStep(
      transform({ axisMirror }, ({ axisMirror }) => axisMirror.links),
    ).config({ name: "pa-update-axis-option-mirror-links" })

    dismissRemoteLinkStep(
      transform({ axisMirror }, ({ axisMirror }) => axisMirror.dismiss_links),
    ).config({ name: "pa-update-axis-option-mirror-dismiss" })

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
