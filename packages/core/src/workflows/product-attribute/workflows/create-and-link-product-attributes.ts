import {
  createHook,
  createWorkflow,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"

export type CreateAndLinkProductAttributesWorkflowInput = {
  product_id: string
  // add?: BatchAddRef[]
  // remove?: string[]
  // update?: BatchUpdateRef[]
}

export type CreateAndLinkProductAttributesWorkflowHooks = [
  Hook<
    "validate",
    { input: CreateAndLinkProductAttributesWorkflowInput },
    unknown
  >,
  Hook<"productAttributesLinked", { product_id: string }, unknown>,
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

    const productAttributesLinked = createHook("productAttributesLinked", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributesLinked],
    })
  },
)
