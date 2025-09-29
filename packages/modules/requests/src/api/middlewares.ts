import { defineMiddlewares } from "@medusajs/medusa";

import { adminMiddlewares } from "./admin/middlewares";
import { vendorMiddlewares } from "./vendor/middlewares";

export default defineMiddlewares({
  routes: [...adminMiddlewares, ...vendorMiddlewares],
});
