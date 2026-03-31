import {
  validateAndTransformQuery,
} from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"

import {
  AdminGetAttributesParams,
} from "../../admin/attributes/validators"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

const VendorGetAttributesParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(AdminGetAttributesParams)

export const vendorAttributesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/attributes",
    middlewares: [
      validateAndTransformQuery(VendorGetAttributesParams, {
        defaults: [
          "id",
          "name",
          "handle",
          "description",
          "ui_component",
          "is_required",
          "possible_values.*",
          "product_categories.*",
        ],
        isList: true,
      }),
    ],
  },
]
