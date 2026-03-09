import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { inviteSellerWorkflow } from "../../../../workflows/seller/workflows/invite-seller"
import { AdminInviteSellerType } from "../validators"

export async function POST(
  req: AuthenticatedMedusaRequest<AdminInviteSellerType>,
  res: MedusaResponse
) {
  const vendorUrl = process.env.VENDOR_URL

  const registration_url = vendorUrl
    ? `${vendorUrl.replace(/\/$/, "")}/register`
    : undefined

  const { result: invitation } = await inviteSellerWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      registration_url,
    },
  })

  res.status(201).json({ invitation })
}
