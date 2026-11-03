import { uploadFilesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { extname } from "path"

const ALLOWED_UPLOADS: Record<string, readonly string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/heic": [".heic"],
}

const assertAllowedFile = (file: Express.Multer.File) => {
  const mimeType = file.mimetype?.split(";")[0].trim().toLowerCase() ?? ""
  const extension = extname(file.originalname ?? "").toLowerCase()
  const extensions = ALLOWED_UPLOADS[mimeType]

  if (!extensions || !extensions.includes(extension)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `File "${file.originalname}" is not an allowed upload type`
    )
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUploadFile>,
  res: MedusaResponse
) => {
  const input = req.files as Express.Multer.File[]

  if (!input?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No files were uploaded"
    )
  }

  input.forEach(assertAllowedFile)

  const { result: files } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: input.map((f) => ({
        filename: f.originalname,
        mimeType: f.mimetype,
        content: f.buffer.toString("base64"),
        access: "public",
      })),
    },
  })

  res.json({ files })
}
