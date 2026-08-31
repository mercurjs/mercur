import { PolicyResource } from "../../utils/policy-resources"
import { PolicyOperation } from "@medusajs/framework/utils"
import multer from "multer"

import { MiddlewareRoute } from "@medusajs/framework/http"

const upload = multer({ storage: multer.memoryStorage() })

export const vendorUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/uploads",
    middlewares: [upload.array("files")],
    policies: [
      {
        resource: PolicyResource.file,
        operation: PolicyOperation.create,
      },
    ],
  },
]
