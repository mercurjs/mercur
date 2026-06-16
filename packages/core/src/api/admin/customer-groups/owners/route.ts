import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { AdminGetCustomerGroupOwnersParamsType } from "../validators"

type CustomerGroupOwner = {
  customer_group_id: string
  seller_id: string
  seller_name: string
}

/**
 * Resolves the owning seller for each customer group via the
 * `seller_customer_group` link. Groups with no link (platform-owned) are
 * absent from the response — the operator UI renders them as "Mercur".
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetCustomerGroupOwnersParamsType>,
  res: MedusaResponse<{ owners: CustomerGroupOwner[] }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const raw = req.validatedQuery.group_ids
  const groupIds = (Array.isArray(raw) ? raw : [raw]).flatMap((v) =>
    v.split(",")
  )

  if (groupIds.length === 0) {
    res.json({ owners: [] })
    return
  }

  const { data: links } = await query.graph({
    entity: "seller_customer_group",
    fields: ["customer_group_id", "seller_id", "seller.name"],
    filters: { customer_group_id: groupIds },
  })

  const owners: CustomerGroupOwner[] = links.map((link) => ({
    customer_group_id: link.customer_group_id,
    seller_id: link.seller_id,
    seller_name: link.seller?.name ?? "",
  }))

  res.json({ owners })
}
