import { defineMiddlewares } from '@medusajs/medusa'

import { storeMiddlewares } from './store/middlewares'
import { vendorMiddlewares } from './vendor/middlewares'

export default defineMiddlewares({
  routes: [...vendorMiddlewares, ...storeMiddlewares]
})
