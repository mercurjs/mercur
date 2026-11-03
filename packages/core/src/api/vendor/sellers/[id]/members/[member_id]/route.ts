import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import { SellerRole } from "@mercurjs/types"

import { VendorUpdateMemberRoleType } from "../../../validators"
import { satisfiesRight } from "../../../../../../permissions"
import {
  updateMemberRoleWorkflow,
  removeSellerMemberWorkflow,
} from "../../../../../../workflows/seller"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateMemberRoleType>,
  res: MedusaResponse
) => {
  const caller = req.seller_context!.seller_member

  if (caller.id === req.params.member_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You cannot change your own role"
    )
  }

  if (
    req.validatedBody.role_id === SellerRole.SELLER_ADMINISTRATION &&
    !canAssignAdministration(req, caller.role_id)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Only administrators can grant the administration role"
    )
  }

  await updateMemberRoleWorkflow(req.scope).run({
    input: {
      seller_member_id: req.params.member_id,
      role_id: req.validatedBody.role_id,
    },
  })

  res.status(200).json({})
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await removeSellerMemberWorkflow(req.scope).run({
    input: {
      seller_member_id: req.params.member_id,
      seller_id: req.params.id,
    },
  })

  res.status(200).json({
    id: req.params.member_id,
    object: "seller_member",
    deleted: true,
  })
}

function canAssignAdministration(
  req: AuthenticatedMedusaRequest,
  callerRoleId: string | null
): boolean {
  if (req.permissions_enforced) {
    return satisfiesRight(req.permissions?.members, "manage")
  }

  return callerRoleId === SellerRole.SELLER_ADMINISTRATION
}
