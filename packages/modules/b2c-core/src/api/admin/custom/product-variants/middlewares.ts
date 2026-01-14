import { validateAndTransformQuery } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";

import { adminProductVariantQueryConfig } from "./query-config";
import { AdminGetProductVariantsParams } from "./validators";

export const adminProductVariantsFilteredMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/custom/product-variants",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductVariantsParams,
        adminProductVariantQueryConfig.list
      ),
    ],
  },
];
