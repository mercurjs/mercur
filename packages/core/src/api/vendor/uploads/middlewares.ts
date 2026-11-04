import { requireAnyPermission } from "../../utils"
import multer from "multer"
import { extname } from "path"

import { MiddlewareRoute } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const ALLOWED_UPLOADS: Record<string, readonly string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/heic": [".heic"],
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    const mimeType = file.mimetype?.split(";")[0].trim().toLowerCase() ?? ""
    const extension = extname(file.originalname ?? "").toLowerCase()
    const extensions = ALLOWED_UPLOADS[mimeType]

    if (!extensions || !extensions.includes(extension)) {
      return callback(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `File "${file.originalname}" is not an allowed upload type`
        )
      )
    }

    callback(null, true)
  },
})

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
