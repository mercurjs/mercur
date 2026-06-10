import { orderClaimAddNewItemWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { resolveOfferItems, AddItemInput } from "../../../../../vendor/orders/resolve-offer-items"
import { resolveOrderSellerId } from "../../../../orders/resolve-order-seller-id"

type AdminAddItemsBody = {
  items: Array<{
    variant_id: string
    quantity: number
    unit_price?: number | null
    internal_note?: string | null
    metadata?: Record<string, unknown> | null
  }>
}

/**
 * Mercur override of Medusa's `POST /admin/claims/:id/outbound/items`.
 * Same pattern as the order-edits / exchange items overrides: smuggle the
 * offer id via `metadata.offer_id`, resolve to the offer's price in the
 * order's currency, and let the existing subscriber attach the
 * `order_line_item ↔ offer` link on `order.claim_created`.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddItemsBody>,
  res: MedusaResponse<HttpTypes.AdminClaimPreviewResponse>
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [claim],
  } = await query.graph({
    entity: "order_claim",
    fields: ["id", "order_id"],
    filters: { id },
  })

  if (!claim?.order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Claim ${id} not found`
    )
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "currency_code"],
    filters: { id: claim.order_id },
  })

  const currencyCode = (
    orders?.[0] as { currency_code?: string } | undefined
  )?.currency_code

  if (!currencyCode) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order for claim ${id} not found`
    )
  }

  const sellerId = await resolveOrderSellerId(req.scope, claim.order_id)

  const resolverInput: AddItemInput[] = req.validatedBody.items.map((i) => ({
    variant_id: i.variant_id,
    offer_id:
      typeof i.metadata?.offer_id === "string"
        ? (i.metadata.offer_id as string)
        : undefined,
    quantity: i.quantity,
    unit_price: i.unit_price,
    internal_note: i.internal_note,
    metadata: i.metadata ?? undefined,
  }))

  const items = await resolveOfferItems({
    container: req.scope,
    sellerId,
    currencyCode,
    items: resolverInput,
  })

  const { result } = await orderClaimAddNewItemWorkflow(req.scope).run({
    input: { items, claim_id: id },
  })

  const {
    data: [orderClaim],
  } = await query.graph({
    entity: "order_claim",
    fields: req.queryConfig.fields,
    filters: { id, ...req.filterableFields },
  })

  res.json({
    order_preview: result as unknown as HttpTypes.AdminOrderPreview,
    claim: orderClaim as unknown as HttpTypes.AdminClaim,
  })
}
