import {
  AuthenticatedMedusaRequest,
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'
import { storeReturnOrderRequestQueryConfig } from './query-config'
import {
  StoreCreateReturnRequest,
  StoreCreateReturnRequestType,
  StoreGetOrderReturnRequestParams
} from './validators'

export const storeOrderReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['GET'],
    matcher: '/store/return-request',
    middlewares: [
      validateAndTransformQuery(
        StoreGetOrderReturnRequestParams,
        storeReturnOrderRequestQueryConfig.list
      )
    ]
  },
  {
    method: ['POST'],
    matcher: '/store/return-request',
    middlewares: [
      validateAndTransformBody(StoreCreateReturnRequest),
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order',
        resourceId: (
          req: AuthenticatedMedusaRequest<StoreCreateReturnRequestType>
        ) => {
          return req.validatedBody.order_id
        }
      })
    ]
  },
  {
    method: ['GET'],
    matcher: '/store/return-request/:id',
    middlewares: [
      checkCustomerResourceOwnershipByResourceId({
        entryPoint: 'order_return_request'
      }),
      validateAndTransformQuery(
        StoreGetOrderReturnRequestParams,
        storeReturnOrderRequestQueryConfig.retrieve
      )
    ]
  }
]
