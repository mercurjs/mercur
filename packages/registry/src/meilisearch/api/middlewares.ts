import { defineMiddlewares } from '@medusajs/medusa'

import { meilisearchStoreMiddlewares } from './store/meilisearch/products/search/middlewares'

export const allMeilisearchMiddlewares = [...meilisearchStoreMiddlewares]

export default defineMiddlewares({
  routes: [...meilisearchStoreMiddlewares],
})
