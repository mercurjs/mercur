import { MedusaRequest, MedusaResponse } from '@medusajs/framework'

import { inviteSellerWorkflow } from '../../../../workflows/seller/workflows'
import { AdminInviteSellerType } from '../validators'

/**
 * @oas [post] /admin/sellers/invite
 * operationId: "AdminInviteSeller"
 * summary: "Invite Seller"
 * description: "Sends an invitation to a new seller to join the platform."
 * x-authenticated: true
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         required:
 *           - email
 *         properties:
 *           email:
 *             type: string
 *             format: email
 *             description: The email address of the seller to invite.
 *           registration_url:
 *             type: string
 *             default: "http://localhost:5173/register"
 *             description: The registration URL for the invitation.
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             invitation:
 *               $ref: "#/components/schemas/AdminSellerInvitation"
 *   "400":
 *     description: Bad Request
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Invalid email format"
 * tags:
 *   - Admin Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function POST(
  req: MedusaRequest<AdminInviteSellerType>,
  res: MedusaResponse
): Promise<void> {
  const { result: invitation } = await inviteSellerWorkflow.run({
    container: req.scope,
    input: req.validatedBody
  })

  res.status(201).json({ invitation })
}
