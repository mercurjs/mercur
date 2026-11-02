import { MedusaContainer } from "@medusajs/framework"
import { refetchEntity } from "@medusajs/framework/http"

export const refetchPayout = async (id: string, scope: MedusaContainer, fields: string[]) =>
  await refetchEntity({ entity: "payout", idOrFilter: id, scope, fields })
