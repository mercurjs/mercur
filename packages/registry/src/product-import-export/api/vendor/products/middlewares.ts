import { MiddlewareRoute } from "@medusajs/medusa"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })

export const productImportExportMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/products/import",
    middlewares: [upload.single("file")],
  },
]
