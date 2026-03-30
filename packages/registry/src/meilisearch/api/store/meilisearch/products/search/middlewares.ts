import { MiddlewareRoute, validateAndTransformBody } from '@medusajs/framework'

import { StoreMeilisearchSearchSchema } from './validators'

export const meilisearchStoreMiddlewares: MiddlewareRoute[] = [
  {
    methods: ['POST'],
    matcher: '/store/meilisearch/products/search',
    middlewares: [validateAndTransformBody(StoreMeilisearchSearchSchema)],
  },
]
