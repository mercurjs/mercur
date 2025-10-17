import { defineMiddlewares } from "@medusajs/medusa";

import { storeMiddlewares } from "./store/middlewares";
import { vendorMiddlewares } from "./vendor/middlewares";
import { adminMiddlewares } from "./admin/middlewares";

export default defineMiddlewares({
  routes: [...storeMiddlewares, ...adminMiddlewares, ...vendorMiddlewares],
});
