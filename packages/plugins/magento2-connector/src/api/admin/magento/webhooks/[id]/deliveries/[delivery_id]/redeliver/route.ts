import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"

import { AdminMagentoWebhookDeliveryResponse } from "../../../../../../../../types"
import { deliverMagentoWebhookWorkflow } from "../../../../../../../../workflows"
import { AdminGetMagentoWebhookParamsType } from "../../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhookParamsType>,
  res: MedusaResponse<AdminMagentoWebhookDeliveryResponse>
) => {
  await deliverMagentoWebhookWorkflow(req.scope).run({
    input: {
      delivery_id: req.params.delivery_id,
      endpoint_id: req.params.id,
      force: true,
    },
  })

  const delivery = await refetchEntity({
    entity: "magento_webhook_delivery",
    idOrFilter: req.params.delivery_id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ delivery })
}
