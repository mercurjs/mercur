import { orderExchangeAddNewItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems } from "../../../../orders/resolve-offer-items"
import { VendorPostExchangesAddItemsReqType } from "../../../validators"

/**
 * `POST /vendor/exchanges/:id/outbound/items` — adds replacement items to the
 * exchange's outbound side. Mercur extension: accepts `{ offer_id, quantity }`
 * and resolves to `variant_id + unit_price`; offer id stashed in metadata for
 * the confirm subscriber to link.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorPostExchangesAddItemsReqType>,
  res: MedusaResponse<{
    order_preview: HttpTypes.AdminOrderPreview
  }>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [exchange],
  } = await query.graph({
    entity: "order_exchange",
    fields: ["id", "order_id"],
    filters: { id },
  })

  if (!exchange?.order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Exchange ${id} not found`
    )
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "currency_code"],
    filters: { id: exchange.order_id },
  })

  const currencyCode = (
    orders?.[0] as { currency_code?: string } | undefined
  )?.currency_code

  if (!currencyCode) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order for exchange ${id} not found`
    )
  }

  const items = await resolveOfferItems({
    container: req.scope,
    sellerId: req.seller_context!.seller_id,
    currencyCode,
    items: req.validatedBody.items,
  })

  const { result } = await orderExchangeAddNewItemWorkflow(req.scope).run({
    input: { items, exchange_id: id },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
