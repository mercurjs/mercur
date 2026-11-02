import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** The payout accounts of a seller, never empty so a seller without one matches nothing. */
export async function sellerAccountFilter(scope: MedusaContainer, sellerId: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller_payout_account",
    fields: ["payout_account_id"],
    filters: { seller_id: sellerId },
  })
  const ids = data.map((link) => link.payout_account_id as string)
  return { account_id: ids.length ? ids : ["none"] }
}
