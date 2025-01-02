import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerRequest from '../../../links/seller-request'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { createRequestWorkflow } from '../../../workflows/requests/workflows'
import { VendorCreateRequestType } from './validators'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: requests, metadata } = await query.graph({
    entity: sellerRequest.entryPoint,
    fields: req.remoteQueryConfig.fields.map((field) => `request.${field}`),
    filters: req.filterableFields,
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    requests: requests.map((relation) => relation.request),
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateRequestType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createRequestWorkflow.run({
    input: {
      data: {
        submitter_id: req.auth_context.actor_id,
        ...req.validatedBody.request
      },
      seller_id: seller.id
    },
    container: req.scope
  })

  const {
    data: [request]
  } = await query.graph({
    entity: 'request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: result.id
    }
  })

  res.status(201).json(request)
}
