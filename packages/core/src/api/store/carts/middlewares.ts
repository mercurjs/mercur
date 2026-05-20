import {
    validateAndTransformBody,
    validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCompleteCartQueryConfig } from "./[id]/complete/query-config"
import { StoreCompleteCartParams } from "./[id]/complete/validators"
import { StoreAddCartLineItem } from "./[id]/line-items/validators"

export const storeCartsMiddlewares: MiddlewareRoute[] = [
    {
        method: ["POST"],
        matcher: "/store/carts/:id/complete",
        middlewares: [
            validateAndTransformQuery(
                StoreCompleteCartParams,
                storeCompleteCartQueryConfig
            ),
        ],
    },
    {
        method: ["POST"],
        matcher: "/store/carts/:id/line-items",
        middlewares: [validateAndTransformBody(StoreAddCartLineItem)],
    },
]
