import { fetchSellerByAuthActorId } from '#/shared/infra/http/utils'
import { inviteMemberWorkflow } from '#/workflows/member/workflows'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorInviteMemberType } from './validators'

/**
 * @oas [post] /vendor/invites
 * operationId: "VendorCreateInvite"
 * summary: "Create a Member Invite"
 * description: "Creates a new member invite for the authenticated vendor."
 * x-authenticated: true
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorInviteMember"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             invite:
 *               $ref: "#/components/schemas/VendorMemberInvite"
 * tags:
 *   - Member
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorInviteMemberType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result: created } = await inviteMemberWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      seller_id: seller.id
    }
  })

  const {
    data: [invite]
  } = await query.graph(
    {
      entity: 'member_invite',
      fields: req.queryConfig.fields,
      filters: { id: created.id }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(201).json({ invite })
}

/**
 * @oas [get] /vendor/invites
 * operationId: "VendorListInvites"
 * summary: "List Member Invites"
 * description: "Retrieves a list of member invites for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: limit
 *     schema:
 *       type: number
 *     description: The number of items to return. Default 50.
 *   - in: query
 *     name: offset
 *     schema:
 *       type: number
 *     description: The number of items to skip before starting the response. Default 0.
 *   - in: query
 *     name: fields
 *     schema:
 *       type: string
 *     description: Comma-separated fields that should be included in the returned data.
 *   - in: query
 *     name: order
 *     schema:
 *       type: string
 *     description: Field used to order the results.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             invites:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorMemberInvite"
 *             count:
 *               type: integer
 *               description: The total number of items available
 *             offset:
 *               type: integer
 *               description: The number of items skipped before these items
 *             limit:
 *               type: integer
 *               description: The number of items per page
 * tags:
 *   - Member
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: invites, metadata } = await query.graph({
    entity: 'member_invite',
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: {
      ...req.queryConfig.pagination
    }
  })

  res.json({
    invites,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
