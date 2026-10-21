import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import MagentoWebhookModuleService from "../../../../../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE } from "../../../../../types"
import {
  AdminGetMagentoWebhookParamsType,
  AdminUpdateMagentoWebhookType,
} from "../validators"

const refetch = async (req: AuthenticatedMedusaRequest, id: string) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "magento_webhook_endpoint",
    fields: req.queryConfig.fields,
    filters: { id },
  }, { throwIfKeyNotFound: true })

  return data[0]
}

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhookParamsType>,
  res: MedusaResponse
) => {
  res.json({ webhook: await refetch(req, req.params.id) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateMagentoWebhookType>,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  await service.updateMagentoWebhookEndpoints({
    id: req.params.id,
    ...req.validatedBody,
  })

  res.json({ webhook: await refetch(req, req.params.id) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service = req.scope.resolve<MagentoWebhookModuleService>(
    MAGENTO_WEBHOOK_MODULE
  )

  await service.deleteMagentoWebhookEndpoints(req.params.id)

  res.json({ id: req.params.id, object: "magento_webhook", deleted: true })
}
