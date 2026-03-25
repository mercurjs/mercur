import { defineMiddlewares } from '@medusajs/medusa'
import { meilisearchStoreMiddlewares } from '../../../packages/registry/src/meilisearch/api/store/meilisearch/products/search/middlewares'

export default defineMiddlewares({
  routes: [...meilisearchStoreMiddlewares],
})
