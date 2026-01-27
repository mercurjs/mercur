import { MiddlewareRoute, validateAndTransformQuery } from "@medusajs/framework/http";
import { AdminGetInventoryItemsParams } from "./validators";
import { adminInvQueryConfig } from "./query-config";

export const adminInvMiddlewares: MiddlewareRoute[] = [
    {
        method: ['GET'],
        matcher: '/admin/inventory-items-vendor',
        middlewares: [
            validateAndTransformQuery(
                AdminGetInventoryItemsParams,
                adminInvQueryConfig.list
            ),
        ],
    }
]