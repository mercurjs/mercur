import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import type ProductAttributeModuleService from "../modules/product-attribute/service"
import { mirrorProductAttributeRenameWorkflowId } from "../../workflows/product-attribute"

/**
 * Listens to `product-attribute.updated` and propagates the attribute's
 * current `name` into every linked `ProductOption.title` through
 * `mirrorProductAttributeRenameWorkflow`.
 *
 * Pattern-match `medusa/.../subscribers/payment-webhook.ts:52-53` and
 * `packages/core/src/subscribers/payout-webhook.ts` — thin subscriber,
 * all logic in the workflow.
 *
 * The event payload only carries `{ id }` (see the `emitEventStep`
 * call in `updateProductAttributesWorkflow`), so this subscriber
 * re-fetches the attribute to get the post-update `name`. The mirror
 * workflow itself is idempotent: a re-fire with the same name no-ops
 * downstream.
 */
export default async function mirrorProductAttributeRenameHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const attributeService = container.resolve<ProductAttributeModuleService>(
    MercurModules.PRODUCT_ATTRIBUTE,
  )

  const attribute = await attributeService.retrieveProductAttribute(
    event.data.id,
  )

  if (!attribute?.name) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(mirrorProductAttributeRenameWorkflowId, {
    input: {
      product_attribute_id: attribute.id,
      new_name: attribute.name,
    },
  })
}

export const config: SubscriberConfig = {
  event: "product-attribute.updated",
  context: {
    subscriberId: "mirror-product-attribute-rename-handler",
  },
}
