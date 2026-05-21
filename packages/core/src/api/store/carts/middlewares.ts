import {
    validateAndTransformBody,
    validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { storeCartRoutesMiddlewares } from "@medusajs/medusa/api/store/carts/middlewares"

import { storeCompleteCartQueryConfig } from "./[id]/complete/query-config"
import { StoreCompleteCartParams } from "./[id]/complete/validators"
import { StoreAddCartLineItem } from "./[id]/line-items/validators"

const OVERRIDDEN_ROUTES = new Set([
    "POST /store/carts/:id/complete",
    "POST /store/carts/:id/line-items",
])

const baseCartsMiddlewares = storeCartRoutesMiddlewares.filter((route) => {
    const methods = Array.isArray(route.method)
        ? route.method
        : route.method
        ? [route.method]
        : []
    return !methods.some((method) =>
        OVERRIDDEN_ROUTES.has(`${method} ${route.matcher}`)
    )
})

export const storeCartsMiddlewares: MiddlewareRoute[] = [
    ...baseCartsMiddlewares,
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
