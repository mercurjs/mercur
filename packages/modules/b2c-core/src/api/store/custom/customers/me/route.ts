import {
  AuthenticatedMedusaRequest,
  MedusaResponse
} from '@medusajs/framework/http'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * @oas [get] /store/custom/customers/me
 * summary: Get Customer Profile
 * description: Retrieve the logged-in customer's profile information including avatar.
 * x-authenticated: true
 * parameters:
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields to include. Use `*,avatar.*` to include avatar details.
 *     required: false
 *     schema:
 *       type: string
 *       example: "*,avatar.*"
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl '{backend_url}/store/customers/me?fields=*,avatar.*' \
 *       -H 'Authorization: Bearer {token}'
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
 *             customer:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 company_name:
 *                   type: string
 *                 has_account:
 *                   type: boolean
 *                 avatar:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     url:
 *                       type: string
 *                     mime_type:
 *                       type: string
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer]
  } = await query.graph({
    entity: 'customer',
    fields: req.queryConfig.fields,
    filters: {
      id: customerId
    }
  })

  res.json({ customer })
}
