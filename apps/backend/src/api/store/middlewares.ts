import { MiddlewareRoute, authenticate } from '@medusajs/framework'

import { storeCartsMiddlewares } from './carts/middlewares'
import { storeOrderReturnRequestsMiddlewares } from './return-request/middlewares'
import { storeReviewMiddlewares } from './reviews/middlewares'
import { storeSellerMiddlewares } from './seller/middlewares'
import { storeShippingOptionRoutesMiddlewares } from './shipping-options/middlewares'
import { storeWishlistMiddlewares } from './wishlist/middlewares'

export const storeMiddlewares: MiddlewareRoute[] = [
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
  ...storeSellerMiddlewares,
  ...storeShippingOptionRoutesMiddlewares,
  ...storeWishlistMiddlewares
]
