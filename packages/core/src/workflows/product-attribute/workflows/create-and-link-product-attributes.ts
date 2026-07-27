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
import { ProductAttributeBatchInput } from "@mercurjs/types"

import { addProductAttributesToProductWorkflow } from "./add-product-attributes-to-product"
import { removeProductAttributesFromProductWorkflow } from "./remove-product-attributes-from-product"
import { updateProductAttributesOnProductWorkflow } from "./update-product-attributes-on-product"

export type CreateAndLinkProductAttributesWorkflowInput =
  ProductAttributeBatchInput & AdditionalData

export type CreateAndLinkProductAttributesWorkflowHooks = [
  Hook<
    "validate",
    { input: CreateAndLinkProductAttributesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributesLinked",
    {
      product_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createAndLinkProductAttributesToProductWorkflowId =
  "create-and-link-product-attributes-to-product"

export const createAndLinkProductAttributesToProductWorkflow: ReturnWorkflow<
  CreateAndLinkProductAttributesWorkflowInput,
  void,
  CreateAndLinkProductAttributesWorkflowHooks
> = createWorkflow(
  createAndLinkProductAttributesToProductWorkflowId,
  function (input: CreateAndLinkProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const removeInput = transform({ input }, ({ input }) => {
      const addIds = new Set(
        (input.add ?? [])
          .map((a) => ("id" in a ? a.id : undefined))
          .filter((id): id is string => !!id),
      )
      return {
        product_id: input.product_id,
        remove: input.remove ?? [],
        readd: (input.remove ?? []).filter((id) => addIds.has(id)),
      }
    })

    when({ input }, ({ input }) => !!input.remove?.length).then(() =>
      removeProductAttributesFromProductWorkflow.runAsStep({
        input: removeInput,
      }),
    )

    when({ input }, ({ input }) => !!input.add?.length).then(() =>
      addProductAttributesToProductWorkflow.runAsStep({
        input: { product_id: input.product_id, add: input.add ?? [] },
      }),
    )

    when({ input }, ({ input }) => !!input.update?.length).then(() =>
      updateProductAttributesOnProductWorkflow.runAsStep({
        input: { product_id: input.product_id, update: input.update ?? [] },
      }),
    )

    const productAttributesLinked = createHook("productAttributesLinked", {
      product_id: input.product_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributesLinked],
    })
  },
)
