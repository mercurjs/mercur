import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ORDER_FULFILLMENT_FIELDS } from "@mercurjs/core/workflows/payout/utils/fulfillment-status"

import { resolveConnector } from "../../../utils/payout-module"
import { CaptureDecisionOptions, CaptureSources } from "../utils/capture-rows"

export type LoadCaptureSourcesStepInput = {
  order_group_ids?: string[]
  payment_collection_ids?: string[]
}

export type LoadCaptureSourcesStepOutput = {
  sources: CaptureSources
  options: CaptureDecisionOptions
}

const empty = (): CaptureSources => ({ collections: [], cart_links: [], groups: [], orders: [] })

export const loadCaptureSourcesStepId = "load-stripe-capture-sources"

/**
 * The cart payments of the given order groups, or every authorized cart
 * payment plus the given open ones (so a payment captured or canceled
 * elsewhere closes its row), with the orders that decide them. Each hop keys
 * on the previous one's results, which a fixed graph query cannot follow
 * through the cart links.
 */
export const loadCaptureSourcesStep = createStep(
  loadCaptureSourcesStepId,
  async (input: LoadCaptureSourcesStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { capture, transfers } = resolveConnector(container).getOptions()
    const options = { capture, transfers }
    const done = (sources: CaptureSources) => new StepResponse<LoadCaptureSourcesStepOutput>({ sources, options })

    let collectionIds: string[]
    if (input.order_group_ids) {
      if (!input.order_group_ids.length) return done(empty())
      const { data: groups } = await query.graph({
        entity: "order_group",
        fields: ["cart_id"],
        filters: { id: input.order_group_ids },
      })
      const cartIds = groups.map((group) => group.cart_id).filter((id): id is string => !!id)
      if (!cartIds.length) return done(empty())
      const { data: links } = await query.graph({
        entity: "cart_payment_collection",
        fields: ["payment_collection_id"],
        filters: { cart_id: cartIds },
      })
      collectionIds = links.map((link) => link.payment_collection_id)
    } else {
      const { data: authorized } = await query.graph({
        entity: "payment_collection",
        fields: ["id"],
        filters: { status: "authorized" },
      })
      collectionIds = Array.from(new Set([...authorized.map((c) => c.id), ...(input.payment_collection_ids ?? [])]))
    }

    if (!collectionIds.length) return done(empty())

    const { data: collections } = await query.graph({
      entity: "payment_collection",
      fields: [
        "id",
        "currency_code",
        "payments.id",
        "payments.amount",
        "payments.raw_amount",
        "payments.captured_at",
        "payments.canceled_at",
        "payments.created_at",
        "payments.captures.amount",
        "payments.captures.raw_amount",
      ],
      filters: { id: collectionIds },
    })

    const { data: cartLinks } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id", "payment_collection_id"],
      filters: { payment_collection_id: collectionIds },
    })
    const cartIds = Array.from(new Set(cartLinks.map((link) => link.cart_id)))
    if (!cartIds.length) return done(empty())

    const { data: groups } = await query.graph({
      entity: "order_group",
      fields: ["id", "cart_id", "orders.id"],
      filters: { cart_id: cartIds },
    })

    // fulfillment_status only resolves with orders at the root of the query.
    const orderIds = groups.flatMap((group) => (group.orders ?? []).map((order) => order.id))
    const { data: orders } = orderIds.length
      ? await query.graph({
          entity: "order",
          fields: ["id", "status", "canceled_at", "total", "metadata", ...ORDER_FULFILLMENT_FIELDS],
          filters: { id: orderIds },
        })
      : { data: [] }

    return done({
      collections: collections as unknown as CaptureSources["collections"],
      cart_links: cartLinks,
      groups: groups as unknown as CaptureSources["groups"],
      orders: orders as unknown as CaptureSources["orders"],
    })
  }
)
