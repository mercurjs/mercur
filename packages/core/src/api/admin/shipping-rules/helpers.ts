import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { ShippingRuleDTO } from "@mercurjs/types"

export const refetchShippingRules = async (
  scope: MedusaContainer,
  ids: string[],
  fields: string[]
) => {
  if (!ids.length) {
    return []
  }
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "shipping_rule",
    fields,
    filters: { id: ids },
  })
  return data as unknown as ShippingRuleDTO[]
}

export const retrieveShippingRule = async (
  scope: MedusaContainer,
  id: string,
  fields: string[]
) => {
  const [shipping_rule] = await refetchShippingRules(scope, [id], fields)
  if (!shipping_rule) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Shipping rule with id ${id} was not found`
    )
  }
  return shipping_rule
}
