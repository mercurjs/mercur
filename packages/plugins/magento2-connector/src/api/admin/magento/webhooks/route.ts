import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  AdminMagentoWebhookCreateResponse,
  AdminMagentoWebhookListResponse,
} from "../../../../types"
import { createMagentoWebhookEndpointsWorkflow } from "../../../../workflows"
import {
  AdminCreateMagentoWebhookType,
  AdminGetMagentoWebhooksParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhooksParamsType>,
  res: MedusaResponse<AdminMagentoWebhookListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: webhooks, metadata } = await query.graph({
    entity: "magento_webhook_endpoint",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    webhooks,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateMagentoWebhookType>,
  res: MedusaResponse<AdminMagentoWebhookCreateResponse>
) => {
  const { result } = await createMagentoWebhookEndpointsWorkflow(req.scope).run({
    input: { endpoints: [req.validatedBody] },
  })

  const webhook = await refetchEntity({
    entity: "magento_webhook_endpoint",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  // The secret is returned once, on creation; list and retrieve never expose it.
  res.status(200).json({ webhook: { ...webhook, secret: result[0].secret } })
}
