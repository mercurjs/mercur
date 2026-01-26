import { validateAndTransformQuery } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import { storeCompleteCartQueryConfig } from "./[id]/complete/query-config"
import { StoreCompleteCartParams } from "./[id]/complete/validators"

export const storeCartsMiddlewares: MiddlewareRoute[] = [
    // {
    //     method: ["POST"],
    //     matcher: "/store/carts/:id/complete",
    //     middlewares: [
    //         validateAndTransformQuery(
    //             StoreCompleteCartParams,
    //             storeCompleteCartQueryConfig
    //         ),
    //     ],
    // },
]
