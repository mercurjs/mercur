import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { acceptMemberInvitesWorkflow } from "../../../../workflows/seller/workflows";
import { VendorAcceptMemberInviteType } from "../validators";

/**
 * @oas [post] /vendor/invites/{id}/accept
 * operationId: "VendorAcceptInvite"
 * summary: "Accept a Member Invite"
 * description: "Accepts a member invite using the provided token and creates a new member."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the invite to accept.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorAcceptMemberInvite"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             invite:
 *               $ref: "#/components/schemas/VendorMemberInvite"
 * tags:
 *   - Vendor Invites
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorAcceptMemberInviteType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result } = await acceptMemberInvitesWorkflow(req.scope).run({
    input: {
      invite: req.validatedBody,
      authIdentityId: req.auth_context.auth_identity_id,
    },
  });

  const {
    data: [invite],
  } = await query.graph(
    {
      entity: "member_invite",
      fields: req.queryConfig.fields,
      filters: { id: result.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ invite });
};
