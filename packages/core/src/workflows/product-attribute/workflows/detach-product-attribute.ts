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

import { syncProductAttributeOptionsWorkflow } from "./sync-product-attribute-options"

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
      fields: [
        "options.id",
        "options.title",
        "attribute_values.id",
        "attribute_values.attribute.id",
        "attribute_values.attribute.name",
      ],
      filters: { id: input.product_id },
    }).config({ name: "detach-pa-load-product" })

    const detachPlan = transform(
      { products, input },
      ({ products, input }) => {
        const product = products[0] as
          | {
              options?: Array<{ id: string; title: string }>
              attribute_values?: Array<{
                id: string
                attribute?: { id?: string; name?: string }
              }>
            }
          | undefined

        const matched = (product?.attribute_values ?? []).filter(
          (v) => v.attribute?.id === input.attribute_id,
        )

        const value_ids = matched.map((v) => v.id)
        const attribute_name = matched[0]?.attribute?.name

        const option_ids = attribute_name
          ? (product?.options ?? [])
              .filter((o) => o.title === attribute_name)
              .map((o) => o.id)
          : []

        return { value_ids, option_ids }
      },
    )

    const links = transform({ detachPlan, input }, ({ detachPlan, input }) =>
      detachPlan.value_ids.map((value_id) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: value_id,
        },
      })),
    )

    dismissRemoteLinkStep(links).config({
      name: "pa-detach-product-attribute-links",
    })

    // Symmetric to the create flow: variant-axis attributes synthesise a
    // product option, so detaching them should drop the matching option
    // too (matched by title === attribute.name). Non-axis attributes
    // never produce an option, so `option_ids` is empty for them.
    syncProductAttributeOptionsWorkflow.runAsStep({
      input: transform({ detachPlan }, ({ detachPlan }) => ({
        delete_ids: detachPlan.option_ids,
      })),
    })

    const productAttributeDetached = createHook("productAttributeDetached", {
      product_id: input.product_id,
      attribute_id: input.attribute_id,
      detached_value_ids: transform(
        { detachPlan },
        ({ detachPlan }) => detachPlan.value_ids,
      ),
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributeDetached],
    })
  },
)
