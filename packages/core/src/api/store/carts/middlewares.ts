import {
    validateAndTransformBody,
    validateAndTransformQuery,
} from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { ORIGINAL_MIDDLEWARES } from "../../../utils/disable-medusa-middlewares"
import { storeCompleteCartQueryConfig } from "./[id]/complete/query-config"
import { StoreCompleteCartParams } from "./[id]/complete/validators"
import { StoreAddCartLineItem } from "./[id]/line-items/validators"

const OVERRIDDEN_ROUTES = new Set([
    "POST /store/carts/:id/complete",
    "POST /store/carts/:id/line-items",
])

// `disableMedusaMiddlewares` has already wholesale-emptied Medusa's cart
// middleware array — read the snapshot it captured and keep every route
// Mercur doesn't override so non-overridden cart routes (POST /store/carts,
// POST /store/carts/:id/promotions, etc.) still get Medusa's validators.
const capturedBase = (ORIGINAL_MIDDLEWARES[
    "dist/api/store/carts/middlewares.js"
] ?? []) as MiddlewareRoute[]

const baseCartsMiddlewares = capturedBase.filter((route) => {
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
