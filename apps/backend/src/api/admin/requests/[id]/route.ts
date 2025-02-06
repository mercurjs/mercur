import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import RequestsModuleService from '../../../../modules/requests/service'
import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils'
import { updateRequestWorkflow } from '../../../../workflows/requests/workflows'
import { AdminReviewRequestType } from '../validators'

export async function POST(
  req: AuthenticatedMedusaRequest<AdminReviewRequestType>,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request]
  } = await query.graph({
    entity: 'request',
    fields: ['id', 'type', 'data', 'submitter_id'],
    filters: {
      id: req.params.id,
      status: 'pending'
    }
  })

  if (!request) {
    throw new MedusaError(
      MedusaError.Types.INVALID_ARGUMENT,
      'This request is already reviewed'
    )
  }

  if (req.validatedBody.status === 'rejected') {
    await updateRequestWorkflow.run({
      input: {
        id: req.params.id,
        reviewer_id: req.auth_context.actor_id,
        ...req.validatedBody
      },
      container: req.scope
    })

    return res.json({
      id: req.params.id,
      status: 'rejected'
    })
  }

  const workflow = RequestsModuleService.getWorkflowByType(request.type)

  if (!workflow) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'This type of request does not have workflow'
    )
  }

  const seller_id = request.type === 'product' && req.validatedBody.assign_product_to_seller
    ? (await fetchSellerByAuthActorId(request.submitter_id, req.scope)).id
    : undefined

  const { result: createdResource } = await workflow(req.scope).run({
    input: {
      id: req.params.id,
      reviewer_id: req.auth_context.actor_id,
      data: request.data,
      ...req.validatedBody,
      seller_id
    },
    throwOnError: true
  })

  return res.json({
    id: req.params.id,
    status: 'accepted',
    createdResourceType: request.type,
    createdResource
  })
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [request]
  } = await query.graph({
    entity: 'request',
    fields: req.remoteQueryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json(request)
}
