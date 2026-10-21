import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import MagentoWebhookModuleService from "../../../../../../../../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE } from "../../../../../../../../types"
import { deliverMagentoWebhookWorkflow } from "../../../../../../../../workflows"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  const delivery = await service.retrieveMagentoWebhookDelivery(
    req.params.delivery_id
  )

  if (delivery.endpoint_id !== req.params.id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Delivery ${req.params.delivery_id} does not belong to webhook ${req.params.id}`
    )
  }

  await service.updateMagentoWebhookDeliveries([
    { id: delivery.id, status: "pending", next_attempt_at: new Date() },
  ])

  const { result } = await deliverMagentoWebhookWorkflow(req.scope).run({
    input: { delivery_id: delivery.id },
  })

  res.json({ delivery: result })
}
