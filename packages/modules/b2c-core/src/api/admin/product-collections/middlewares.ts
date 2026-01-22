import { MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { collectionsQueryConfig } from "./query-config";
import { GetCollectionsParams, UpdateCollectionDetail } from "./validators";

export const collectionsMiddlewares: MiddlewareRoute[] = [
    {
        method: ["GET"],
        matcher: "/admin/product-collections/:id/details",
        middlewares: [
            validateAndTransformQuery(
                GetCollectionsParams,
                collectionsQueryConfig.retrieve
            )
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/product-collections/:id/details",
        middlewares: [
            validateAndTransformQuery(
                GetCollectionsParams,
                collectionsQueryConfig.retrieve
            ),
            validateAndTransformBody(UpdateCollectionDetail),
        ],
    }
]