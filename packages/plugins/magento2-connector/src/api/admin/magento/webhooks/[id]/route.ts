import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  AdminMagentoWebhookDeleteResponse,
  AdminMagentoWebhookResponse,
} from "../../../../../types"
import {
  deleteMagentoWebhookEndpointsWorkflow,
  updateMagentoWebhookEndpointsWorkflow,
} from "../../../../../workflows"
import {
  AdminGetMagentoWebhookParamsType,
  AdminUpdateMagentoWebhookType,
} from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetMagentoWebhookParamsType>,
  res: MedusaResponse<AdminMagentoWebhookResponse>
) => {
  const webhook = await refetchEntity({
    entity: "magento_webhook_endpoint",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  if (!webhook) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Magento webhook with id "${req.params.id}" not found`
    )
  }

  res.json({ webhook })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateMagentoWebhookType>,
  res: MedusaResponse<AdminMagentoWebhookResponse>
) => {
  await updateMagentoWebhookEndpointsWorkflow(req.scope).run({
    input: { endpoints: [{ id: req.params.id, ...req.validatedBody }] },
  })

  const webhook = await refetchEntity({
    entity: "magento_webhook_endpoint",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ webhook })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<AdminMagentoWebhookDeleteResponse>
) => {
  await deleteMagentoWebhookEndpointsWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({ id: req.params.id, object: "magento_webhook", deleted: true })
}
