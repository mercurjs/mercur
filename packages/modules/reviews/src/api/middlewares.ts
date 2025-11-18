import { defineMiddlewares } from "@medusajs/medusa";

import { adminMiddlewares } from "./admin/middlewares";
import { vendorMiddlewares } from "./vendor/middlewares";
import { storeReviewMiddlewares } from "./store/reviews/middlewares";

export default defineMiddlewares({
  routes: [...adminMiddlewares, ...vendorMiddlewares, ...storeReviewMiddlewares],
});
