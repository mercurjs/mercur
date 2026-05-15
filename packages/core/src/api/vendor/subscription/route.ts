import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorSubscriptionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id

  const { data: plans } = await query.graph({
    entity: "subscription_plan",
    fields: req.queryConfig.fields,
    filters: {
      currency_code: req.seller_context!.currency_code,
    },
  })

  const plan = plans[0]

  if (!plan) {
    res.json({
      subscription_plan: null,
      subscription_override: null,
    })
    return
  }

  const override =
    (plan).overrides?.find(
      (o: any) => o.reference === "seller" && o.reference_id === sellerId
    ) ?? null

  const { ...planWithoutOverrides } = plan as any

  res.json({
    subscription_plan: planWithoutOverrides,
    subscription_override: override,
  })
}
