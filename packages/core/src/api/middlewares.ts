import { defineMiddlewares } from "@medusajs/medusa"

import { vendorMiddlewares } from "./vendor/middlewares"

export default defineMiddlewares({
  routes: [...vendorMiddlewares],
})
