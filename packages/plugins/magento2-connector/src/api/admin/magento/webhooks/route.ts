import { randomBytes } from "node:crypto"

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import MagentoWebhookModuleService from "../../../../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE } from "../../../../types"
import {
  AdminCreateMagentoWebhookType,
  AdminGetMagentoWebhooksParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhooksParamsType>,
  res: MedusaResponse
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
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  const { secret, ...rest } = req.validatedBody
  const generatedSecret = secret ?? randomBytes(32).toString("hex")

  const webhook = await service.createMagentoWebhookEndpoints({
    ...rest,
    secret: generatedSecret,
  })

  // The secret is only ever returned on creation.
  res.status(200).json({ webhook: { ...webhook, secret: generatedSecret } })
}
