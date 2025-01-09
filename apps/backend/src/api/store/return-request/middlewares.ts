import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import { checkCustomerResourceOwnershipByResourceId } from '../../../shared/infra/http/middlewares/check-customer-ownership'

export const storeOrderReturnRequestsMiddlewares: MiddlewareRoute[] = [
  {
    method: ['ALL'],
    matcher: '/store/return-request/*',
    middlewares: [authenticate('user', ['bearer', 'session'])]
  },
  {
    method: ['GET'],
    matcher: '/store/return-request/:id',
    middlewares: [checkCustomerResourceOwnershipByResourceId('return-request')]
  }
]
