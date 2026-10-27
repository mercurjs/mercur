import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { LinkDefinition } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

export type SetProductCategoryShippingProfileWorkflowInput = {
  id: string
  shipping_profile_id: string | null
}

export const setProductCategoryShippingProfileWorkflowId =
  "mercur-set-product-category-shipping-profile"

export const setProductCategoryShippingProfileWorkflow = createWorkflow(
  setProductCategoryShippingProfileWorkflowId,
  (input: WorkflowData<SetProductCategoryShippingProfileWorkflowInput>) => {
    const { data: categories } = useQueryGraphStep({
      entity: "product_category",
      fields: ["id", "default_shipping_profile.id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-category-shipping-profile" })

    const { toDismiss, toCreate } = transform(
      { input, categories },
      ({ input, categories }) => {
        const current = (
          categories[0] as {
            default_shipping_profile?: { id: string } | null
          }
        )?.default_shipping_profile?.id
        const toDismiss: LinkDefinition[] = []
        const toCreate: LinkDefinition[] = []
        if (current === input.shipping_profile_id) {
          return { toDismiss, toCreate }
        }
        if (current) {
          toDismiss.push({
            [Modules.PRODUCT]: { product_category_id: input.id },
            [Modules.FULFILLMENT]: { shipping_profile_id: current },
          })
        }
        if (input.shipping_profile_id) {
          toCreate.push({
            [Modules.PRODUCT]: { product_category_id: input.id },
            [Modules.FULFILLMENT]: {
              shipping_profile_id: input.shipping_profile_id,
            },
          })
        }
        return { toDismiss, toCreate }
      }
    )

    dismissRemoteLinkStep(toDismiss)
    createRemoteLinkStep(toCreate)

    return new WorkflowResponse(void 0)
  }
)
