import { defineMiddlewares } from "@medusajs/medusa"

import { adminMiddlewares } from "./admin/middlewares"
import { storeMiddlewares } from "./store/middlewares"
import { vendorMiddlewares } from "./vendor/middlewares"
import { hooksRoutesMiddlewares } from "./hooks/middlewares"
import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MercurModules } from "@mercurjs/types"
import VendorUIModuleService from "../modules/vendor-ui/services/vendor-ui-module-service"
import AdminUIModuleService from "../modules/admin-ui/services/admin-ui-module-service"
import { DashboardBase } from "../utils/dashboard/dashboard-base"

function dashboardMiddleware(service: DashboardBase) {
  return (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const options = service.getOptions()
    if (options.disable) {
      return next()
    }
    const app = service.getApp()
    app(req, res, next)
  }
}

export default defineMiddlewares({
  routes: [
    ...adminMiddlewares,
    ...storeMiddlewares,
    ...vendorMiddlewares,
    ...hooksRoutesMiddlewares,
    {
      matcher: "*",
      method: ["GET"],
      middlewares: [(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
        const adminUI = req.scope.resolve<AdminUIModuleService>(MercurModules.ADMIN_UI)
        const vendorUI = req.scope.resolve<VendorUIModuleService>(MercurModules.VENDOR_UI)

        dashboardMiddleware(adminUI)(req, res, (err?: any) => {
          if (err) return next(err)
          dashboardMiddleware(vendorUI)(req, res, next)
        })
      }],
    },
  ],
})
