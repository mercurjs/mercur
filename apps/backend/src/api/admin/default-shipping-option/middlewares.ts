import {
  MiddlewareRoute,
  validateAndTransformBody,
  validateAndTransformQuery
} from '@medusajs/framework'

import { AdminCreateDefaultSippingOption } from './validators'

export const defaultShippingOptionMiddlewares: MiddlewareRoute[] = [
  // {
  //   method: ['GET'],
  //   matcher: '/admin/default-shipping-option',
  //   middlewares: [validateAndTransformQuery(, {})]
  // },
  {
    method: ['POST'],
    matcher: '/admin/default-shipping-option',
    middlewares: [validateAndTransformBody(AdminCreateDefaultSippingOption)]
  }
  // {
  //   method: ['POST'],
  //   matcher: '/admin/default-shipping-option/:id',
  //   middlewares: [validateAndTransformBody()]
  // }
]
