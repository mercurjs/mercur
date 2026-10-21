import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminGetMagentoWebhookDeliveriesParamsType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhookDeliveriesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: deliveries, metadata } = await query.graph({
    entity: "magento_webhook_delivery",
    fields: req.queryConfig.fields,
    filters: { ...req.filterableFields, endpoint_id: req.params.id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    deliveries,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
