import { Modules } from "@medusajs/framework/utils"
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
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

export type DetachProductAttributeWorkflowInput = {
  product_id: string
  attribute_id: string
}

export type DetachProductAttributeWorkflowHooks = [
  Hook<"validate", { input: DetachProductAttributeWorkflowInput }, unknown>,
  Hook<
    "productAttributeDetached",
    {
      product_id: string
      attribute_id: string
      detached_value_ids: string[]
    },
    unknown
  >,
]

export const detachProductAttributeWorkflowId = "detach-product-attribute"

export const detachProductAttributeWorkflow: ReturnWorkflow<
  DetachProductAttributeWorkflowInput,
  void,
  DetachProductAttributeWorkflowHooks
> = createWorkflow(
  detachProductAttributeWorkflowId,
  function (input: DetachProductAttributeWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["attribute_values.id", "attribute_values.attribute.id"],
      filters: { id: input.product_id },
    }).config({ name: "detach-pa-load-product" })

    const valueIds = transform({ products, input }, ({ products, input }) => {
      const values = (products[0]?.attribute_values ?? []) as Array<{
        id: string
        attribute?: { id?: string }
      }>
      return values
        .filter((v) => v.attribute?.id === input.attribute_id)
        .map((v) => v.id)
    })

    const links = transform({ valueIds, input }, ({ valueIds, input }) =>
      valueIds.map((value_id) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: value_id,
        },
      })),
    )

    dismissRemoteLinkStep(links).config({
      name: "pa-detach-product-attribute-links",
    })

    const productAttributeDetached = createHook("productAttributeDetached", {
      product_id: input.product_id,
      attribute_id: input.attribute_id,
      detached_value_ids: valueIds,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributeDetached],
    })
  },
)
