import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../modules/product-attribute/service"
import { mirrorProductAttributeValueRenameWorkflowId } from "../../workflows/product-attribute"

/**
 * Listens to `product-attribute-value.updated` and propagates the
 * value's current `name` into every linked `ProductOptionValue.value`
 * through `mirrorProductAttributeValueRenameWorkflow`.
 *
 * Same shape as the sibling
 * `mirror-product-attribute-rename` subscriber — re-fetches the value
 * to get the post-update `name` because the event payload only carries
 * `{ id }`.
 */
export default async function mirrorProductAttributeValueRenameHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const attributeService = container.resolve<ProductAttributeModuleService>(
    MercurModules.PRODUCT_ATTRIBUTE,
  )

  const value = await attributeService.retrieveProductAttributeValue(
    event.data.id,
  )

  if (!value?.name) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(mirrorProductAttributeValueRenameWorkflowId, {
    input: {
      product_attribute_value_id: value.id,
      new_value: value.name,
    },
  })
}

export const config: SubscriberConfig = {
  event: "product-attribute-value.updated",
  context: {
    subscriberId: "mirror-product-attribute-value-rename-handler",
  },
}
