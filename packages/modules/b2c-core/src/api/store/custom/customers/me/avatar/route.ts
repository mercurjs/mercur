import { uploadFilesWorkflow } from '@medusajs/core-flows'
import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { Modules, MedusaError, ContainerRegistrationKeys } from '@medusajs/framework/utils'

import customerFileLink from '../../../../../../links/customer-file'
/**
 * @oas [post] /store/custom/customers/me/avatar
 * summary: Upload Customer Avatar
 * description: Upload or update the logged-in customer's profile avatar image.
 * x-authenticated: true
 * requestBody:
 *   content:
 *     multipart/form-data:
 *       schema:
 *         type: object
 *         required:
 *           - file
 *         properties:
 *           file:
 *             type: string
 *             format: binary
 *             description: The avatar image file
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl -X POST '{backend_url}/store/customers/me/avatar' \
 *       -H 'Authorization: Bearer {token}' \
 *       -F 'file=@/path/to/avatar.jpg'
 * tags:
 *   - Customers
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             file:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 url:
 *                   type: string
 *                 mime_type:
 *                   type: string
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  console.log("customerId", customerId);
  const file = (req as any).file

  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'No file was uploaded'
    )
  }

  const { result: files } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: [
        {
          filename: file.originalname,
          mimeType: file.mimetype,
          content: file.buffer.toString('base64'),
          // TODO: verify how to set access for customers files
          access: 'public'
        }
      ]
    }
  })

  const uploadedFile = files[0]

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existingLinks } = await query.graph({
    entity: customerFileLink.entryPoint,
    fields: ['file_id'],
    filters: {
      customer_id: customerId,
      deleted_at: null
    }
  })
  if (existingLinks.length > 0) {
    const oldFileId = existingLinks[0].file_id

    await link.dismiss({
      [Modules.CUSTOMER]: { customer_id: customerId },
      [Modules.FILE]: { file_id: oldFileId }
    })

    const fileService = req.scope.resolve(Modules.FILE)
    await fileService.deleteFiles(oldFileId)
  }

  await link.create({
    [Modules.CUSTOMER]: { customer_id: customerId },
    [Modules.FILE]: { file_id: uploadedFile.id }
  })

  res.json({ file: uploadedFile })
}

/**
 * @oas [delete] /store/custom/customers/me/avatar
 * summary: Delete Customer Avatar
 * description: Delete the logged-in customer's profile avatar image.
 * x-authenticated: true
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl -X DELETE '{backend_url}/store/customers/me/avatar' \
 *       -H 'Authorization: Bearer {token}'
 * tags:
 *   - Customers
 * responses:
 *   "204":
 *     description: Avatar successfully deleted
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existingLinks } = await query.graph({
    entity: customerFileLink.entryPoint,
    fields: ['file_id'],
    filters: {
      customer_id: customerId,
      deleted_at: null
    }
  })

  const fileId = existingLinks[0].file_id

  if (existingLinks.length > 0) {
    await link.dismiss({
      [Modules.CUSTOMER]: { customer_id: customerId },
      [Modules.FILE]: { file_id: fileId }
    })

    const fileService = req.scope.resolve(Modules.FILE)
    await fileService.deleteFiles(fileId)

    res.status(204).send()
  }
}
