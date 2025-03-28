import {
  MiddlewareRoute,
  authenticate,
  validateAndTransformBody
} from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'
import { CreateQuickOrder } from './quick-order/validators'
import { storeOrderReturnRequestsMiddlewares } from './return-request/middlewares'
import { storeReviewMiddlewares } from './reviews/middlewares'
import { storeSellerMiddlewares } from './seller/middlewares'

export const storeMiddlewares: MiddlewareRoute[] = [
  {
    methods: ['POST'],
    matcher: '/store/quick-order',
    middlewares: [validateAndTransformBody(CreateQuickOrder)]
  },
  {
    matcher: '/store/reviews/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  {
    matcher: '/store/return-request/*',
    middlewares: [authenticate('customer', ['bearer', 'session'])]
  },
  ...storeCartsMiddlewares,
  ...storeOrderReturnRequestsMiddlewares,
  ...storeReviewMiddlewares,
  ...storeSellerMiddlewares
]
