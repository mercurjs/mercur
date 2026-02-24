import { MiddlewareRoute, validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";
import { categoriesQueryConfig } from "./query-config";
import { GetCategoriesParams, UpdateCategoryDetail } from "./validators";

export const productCategoriesMiddlewares: MiddlewareRoute[] = [
    {
        method: ["GET"],
        matcher: "/admin/product-categories/:id/details",
        middlewares: [
            validateAndTransformQuery(
                GetCategoriesParams,
                categoriesQueryConfig.retrieve
            )
        ],
    },
    {
        method: ["POST"],
        matcher: "/admin/product-categories/:id/details",
        middlewares: [
            validateAndTransformQuery(
                GetCategoriesParams,
                categoriesQueryConfig.retrieve
            ),
            validateAndTransformBody(UpdateCategoryDetail),
        ],
    }
]

