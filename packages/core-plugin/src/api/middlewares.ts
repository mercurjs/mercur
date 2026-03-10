import { defineMiddlewares } from "@medusajs/medusa"

import { adminMiddlewares } from "./admin/middlewares"
import { storeMiddlewares } from "./store/middlewares"
import { vendorMiddlewares } from "./vendor/middlewares"
import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MercurModules } from "@mercurjs/types"
import VendorUIModuleService from "../modules/vendor-ui/services/vendor-ui-module-service"

export default defineMiddlewares({
  routes: [
    ...adminMiddlewares,
    ...storeMiddlewares,
    ...vendorMiddlewares,
    {
      matcher: "*",
      method: ["GET"],
      middlewares: [(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
        const service = req.scope.resolve<VendorUIModuleService>(MercurModules.VENDOR_UI)
        const options = service.getOptions()
        if (options.disable) {
          return next()
        }
        const app = service.getApp()
        app(req, res, next)
      }],
    },
  ],
})
