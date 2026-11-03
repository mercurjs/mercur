import { AuthenticatedMedusaRequest } from "@medusajs/framework"
import { SellerRole } from "@mercurjs/types"

import { satisfiesRight } from "../../../permissions"

export const canAssignAdministration = (
  req: AuthenticatedMedusaRequest,
  callerRoleId: string | null
): boolean => {
  if (req.permissions_enforced) {
    return satisfiesRight(req.permissions?.members, "manage")
  }

  return callerRoleId === SellerRole.SELLER_ADMINISTRATION
}
