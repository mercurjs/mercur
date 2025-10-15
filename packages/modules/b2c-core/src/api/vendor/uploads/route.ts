import { uploadFilesWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { HttpTypes } from '@medusajs/framework/types'
import { MedusaError } from '@medusajs/framework/utils'

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUploadFile>,
  res: MedusaResponse
) => {
  const input = (req as any).files

  if (!input?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'No files were uploaded'
    )
  }

  const { result: files } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: input?.map((f) => ({
        filename: f.originalname,
        mimeType: f.mimetype,
        content: f.buffer.toString('binary'),
        access: 'public'
      }))
    }
  })

  res.json({ files })
}
