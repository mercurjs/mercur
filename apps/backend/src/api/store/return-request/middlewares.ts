import {
  AuthenticatedMedusaRequest,
  MiddlewareRoute,
  authenticate
} from '@medusajs/framework'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'
import { StoreCreateReturnRequestType } from './validators'

export const storeOrderReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['ALL'],
    matcher: '/store/return-request/*',
    middlewares: [authenticate('user', ['bearer', 'session'])]
  },
  {
    method: ['POST'],
    matcher: '/store/return-request',
    middlewares: [
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
      })
    ]
  }
]
