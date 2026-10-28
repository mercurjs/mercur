import { MedusaContainer } from "@medusajs/framework"
import { refetchEntity } from "@medusajs/framework/http"

export const refetchPayoutAccount = async (id: string, scope: MedusaContainer, fields: string[]) =>
  await refetchEntity({ entity: "payout_account", idOrFilter: id, scope, fields })
