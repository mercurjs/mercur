import { defineMiddlewares } from "@medusajs/framework"

import { adminMagentoMiddlewares } from "./admin/magento/middlewares"

export default defineMiddlewares({
  routes: [...adminMagentoMiddlewares],
})
