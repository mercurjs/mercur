import { requirePermission } from "../../utils"
import multer from "multer"

import { MiddlewareRoute } from "@medusajs/framework/http"

const upload = multer({ storage: multer.memoryStorage() })

export const vendorUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/uploads",
    middlewares: [
      requirePermission("products", "edit"),
      upload.array("files")],
  },
]
