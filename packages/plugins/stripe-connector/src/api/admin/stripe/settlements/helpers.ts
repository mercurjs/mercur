import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { AdminSettlement } from "../../../../types/http"

export async function refetchSettlement(
  id: string,
  scope: MedusaContainer,
  fields: string[],
  filters: Record<string, unknown> = {}
): Promise<AdminSettlement> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [settlement],
  } = await query.graph({ entity: "settlement", fields, filters: { ...filters, id } })
  if (!settlement) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Settlement ${id} was not found`)
  }
  return settlement as unknown as AdminSettlement
}
