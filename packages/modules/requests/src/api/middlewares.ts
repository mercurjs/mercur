import { defineMiddlewares } from "@medusajs/medusa";

import { adminMiddlewares } from "./admin/middlewares";
import { vendorMiddlewares } from "./vendor/middlewares";
import { storeMiddlewares } from "./store/middlewares";

export default defineMiddlewares({
  routes: [...adminMiddlewares, ...vendorMiddlewares, ...storeMiddlewares],
});
