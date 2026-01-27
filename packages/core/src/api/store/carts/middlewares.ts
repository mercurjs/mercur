import { validateAndTransformQuery } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCheckoutCartQueryConfig } from "./[id]/checkout/query-config"
import { StoreCheckoutCartParams } from "./[id]/checkout/validators"

export const storeCartsMiddlewares: MiddlewareRoute[] = [
    {
        method: ["POST"],
        matcher: "/store/carts/:id/checkout",
        middlewares: [
            validateAndTransformQuery(
                StoreCheckoutCartParams,
                storeCheckoutCartQueryConfig
            ),
        ],
    },
]
