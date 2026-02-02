import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { AdminCreateFeaturedCollection } from "./validators";

export const adminFeaturedCollectionsMiddlewares: MiddlewareRoute[] = [
    {
        method: ["POST"],
        matcher: "/admin/featured-collections",
        middlewares: [
            validateAndTransformBody(AdminCreateFeaturedCollection),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/featured-collections",
        middlewares: [
            // validateAndTransformQuery(AdminGetFeaturedCollectionsParams),
        ],
    },
    {
        method: ["GET"],
        matcher: "/admin/featured-collections/:id",
        middlewares: [
            // validateAndTransformQuery(AdminGetFeaturedCollectionsParams),
        ],
    }
]