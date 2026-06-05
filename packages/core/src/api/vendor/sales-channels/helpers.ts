import { MedusaContainer } from "@medusajs/framework"
import { refetchEntity } from "@medusajs/framework/http"

export const refetchSalesChannel = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  return await refetchEntity({
    entity: "sales_channel",
    idOrFilter: id,
    scope,
    fields,
  })
}
