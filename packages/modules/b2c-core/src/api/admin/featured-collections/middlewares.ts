import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework";
import { AdminCreateFeaturedCollection, AdminUpdateFeaturedCollection } from "./validators";

export const adminFeaturedCollectionsMiddlewares: MiddlewareRoute[] = [
    {
        method: ["POST"],
        matcher: "/admin/featured-collections",
        middlewares: [
            validateAndTransformBody(AdminCreateFeaturedCollection),
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/featured-collections/:id",
        middlewares: [
            validateAndTransformBody(AdminUpdateFeaturedCollection),
        ],
    },
]