import { defineMiddlewares } from "@medusajs/medusa";

import { adminSpraayMiddlewares } from "./admin/spraay/middlewares";

export default defineMiddlewares({
    routes: [...adminSpraayMiddlewares],
});
