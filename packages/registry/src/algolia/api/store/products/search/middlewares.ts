import {
  MiddlewareRoute,
  validateAndTransformBody
} from '@medusajs/framework'

import { StoreSearchProductsSchema } from './validators'

export const algoliaMiddlewares: MiddlewareRoute[] = [
  {
    methods: ['POST'],
    matcher: '/store/products/search',
    middlewares: [validateAndTransformBody(StoreSearchProductsSchema)]
  }
]
