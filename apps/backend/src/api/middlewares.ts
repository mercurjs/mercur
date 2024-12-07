import { defineMiddlewares } from '@medusajs/medusa'

import { adminMiddlewares } from './admin/middlewares'
import { storeMiddlewares } from './store/middlewares'
import { vendorMiddlewares } from './vendor/middlewares'

export default defineMiddlewares({
  routes: [...vendorMiddlewares, ...storeMiddlewares, ...adminMiddlewares]
})
