import { requireAnyPermission } from "../../utils"
import multer from "multer"

import { MiddlewareRoute } from "@medusajs/framework/http"

const upload = multer({ storage: multer.memoryStorage() })

export const vendorUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/uploads",
    middlewares: [
      // Product media and the store logo/banner both upload through here.
      requireAnyPermission([
        { key: "products", right: "edit" },
        { key: "store", right: "edit" },
      ]),
      upload.array("files"),
    ],
  },
]
