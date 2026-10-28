import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  createCartWorkflow,
  createOrderFulfillmentWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  refundPaymentWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  addSellerShippingMethodToCartWorkflow,
  completeCartWithSplitOrdersWorkflow,
} from "@mercurjs/core/workflows"
import { MercurModules } from "@mercurjs/types"
import { getStripeClient } from "@mercurjs/stripe-connector-plugin/lib/stripe-client"
import { JobTrigger, STRIPE_CONNECTOR_MODULE } from "@mercurjs/stripe-connector-plugin/types"
import { runJob } from "@mercurjs/stripe-connector-plugin/utils/run-job"
import { jobWorkflow } from "@mercurjs/stripe-connector-plugin/workflows/jobs"

/**
 * Walks one Sole Society order through the whole Stripe pipeline against the
 * sandbox: Stripe-authorized checkout, fulfilment, capture, transfer, a
 * partial refund with its reversal, and a settlement that pays the seller
 * out. The connected account must already be active.
 *
 * Run (with the API running on the same database and Redis):
 *   bun --cwd apps/api run medusa exec ./src/scripts/simulate-stripe-payouts.ts
 */
const SELLER_NAME = "Sole Society"
const SHIPPING_OPTION_NAME = "Standard Shipping"
const PAYMENT_PROVIDER_ID = "pp_stripe-connector_stripe"
// Test card whose funds skip the pending balance, so the payout has money to move.
const TEST_PAYMENT_METHOD = "pm_card_bypassPending"
const REFUND_SHARE = 0.25
// Set to an existing order id to skip checkout and fulfilment and re-run the pipeline on it.
const RESUME_ORDER_ID = process.env.RESUME_ORDER_ID
const SKIP_REFUND = process.env.SKIP_REFUND === "1"

const providerIdOf = (data: unknown) => (data as { provider?: { id?: string } } | null)?.provider?.id

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default async function simulateStripePayouts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const regionModule = container.resolve(Modules.REGION)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const payoutService = container.resolve(MercurModules.PAYOUT)

  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  const stripe = getStripeClient(apiKey)

  // 1. seller, account, shipping option
  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "payout_account.id", "payout_account.status", "payout_account.external_id"],
    filters: { name: SELLER_NAME },
  })
  if (!seller) throw new Error(`Seller ${SELLER_NAME} not found`)
  if (seller.payout_account?.status !== "active") {
    throw new Error(`${SELLER_NAME}'s payout account is ${seller.payout_account?.status ?? "missing"}; finish onboarding first`)
  }
  logger.info(`Seller ${seller.name} (${seller.id}) on ${seller.payout_account.external_id}`)

  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "seller.id", "service_zone.id", "service_zone.fulfillment_set_id"],
    filters: { name: SHIPPING_OPTION_NAME },
  })
  const shippingOption = shippingOptions.find((so) => so.seller?.id === seller.id)
  if (!shippingOption?.service_zone?.id) throw new Error(`${SELLER_NAME} has no "${SHIPPING_OPTION_NAME}" option`)

  const geoZones = await fulfillmentModule.listGeoZones(
    { type: "country", service_zone_id: shippingOption.service_zone.id },
    { take: null }
  )
  const optionCountries = new Set(geoZones.map((g) => g.country_code?.toLowerCase()).filter(Boolean) as string[])

  // 2. region covering one of those countries, with the Stripe provider enabled
  const regions = await regionModule.listRegions({}, { relations: ["countries", "payment_providers"] })
  let region = regions.find((r) => r.countries?.some((c) => c.iso_2 && optionCountries.has(c.iso_2.toLowerCase())))
  if (!region) throw new Error("No region covers the shipping option's countries")
  const country = region.countries!.find((c) => c.iso_2 && optionCountries.has(c.iso_2.toLowerCase()))!.iso_2!.toLowerCase()

  if (!region.payment_providers?.some((p) => p.id === PAYMENT_PROVIDER_ID)) {
    await link.create({
      [Modules.REGION]: { region_id: region.id },
      [Modules.PAYMENT]: { payment_provider_id: PAYMENT_PROVIDER_ID },
    })
    logger.info(`Enabled ${PAYMENT_PROVIDER_ID} on region ${region.name}`)
  }

  const [salesChannel] = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" }, { take: 1 })
  if (!salesChannel) throw new Error("Default sales channel not found")

  const fulfillmentSetId = shippingOption.service_zone.fulfillment_set_id
  const { data: stockLocations } = await query.graph({
    entity: "stock_locations",
    fields: ["id", "fulfillment_sets.id"],
  })
  const locationId = stockLocations.find((sl) => (sl.fulfillment_sets ?? []).some((fs) => fs?.id === fulfillmentSetId))?.id
  if (!locationId) throw new Error("Seller stock location not found")
  await link
    .create({
      [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
      [Modules.STOCK_LOCATION]: { stock_location_id: locationId },
    })
    .catch(() => null)

  // 3. one published offer with stock
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id", "sku", "variant_id"],
    filters: { seller_id: seller.id },
  })
  const productModule = container.resolve(Modules.PRODUCT)
  const variants = await productModule.listProductVariants(
    { id: offers.map((o) => o.variant_id).filter(Boolean) as string[] },
    { relations: ["product"], take: null }
  )
  const published = new Set(variants.filter((v) => v.product?.status === "published").map((v) => v.id))
  const offer = offers.find((o) => o.variant_id && published.has(o.variant_id))
  if (!offer) throw new Error(`${SELLER_NAME} has no offer on a published product`)

  const run = async (job: Parameters<typeof runJob>[1], scope: Parameters<typeof jobWorkflow>[2] = {}) => {
    const result = await runJob(container, job, JobTrigger.MANUAL, jobWorkflow(job, container, scope))
    logger.info(`${job}: ${result?.status} ${JSON.stringify(result?.stats ?? {})}${result?.error ? ` error=${result.error}` : ""}`)
    return result
  }

  let order: { id: string; display_id: number; total: unknown; items?: { id: string; quantity: number }[] | null }
  let groupId: string

  if (RESUME_ORDER_ID) {
    const {
      data: [existing],
    } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "total", "items.id", "items.quantity"],
      filters: { id: RESUME_ORDER_ID },
    })
    if (!existing) throw new Error(`Order ${RESUME_ORDER_ID} not found`)
    order = existing as never
    const { data: links } = await query.graph({ entity: "order_group_order", fields: ["order_group_id"], filters: { order_id: order.id } })
    groupId = links[0]?.order_group_id
    logger.info(`Resuming on order #${order.display_id} (${order.id})`)
  } else {
  // 4. cart → Stripe session → confirm with the test card → complete
  const address = {
    first_name: "Stripe",
    last_name: "Tester",
    address_1: "1 Test Street",
    city: "Testville",
    country_code: country,
    postal_code: "10000",
  }
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      email: "stripe-tester@example.com",
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      currency_code: region.currency_code,
      shipping_address: address,
      billing_address: address,
    },
  })
  await addToCartWorkflow(container).run({
    input: {
      cart_id: cart.id,
      items: [{ variant_id: offer.variant_id, quantity: 2, offer_id: offer.id, metadata: { offer_id: offer.id } } as never],
    },
  })
  await addSellerShippingMethodToCartWorkflow(container).run({
    input: { cart_id: cart.id, options: [{ id: shippingOption.id }] },
  })
  const { result: paymentCollection } = await createPaymentCollectionForCartWorkflow(container).run({
    input: { cart_id: cart.id },
  })
  const { result: sessions } = await createPaymentSessionsWorkflow(container).run({
    input: { payment_collection_id: paymentCollection.id, provider_id: PAYMENT_PROVIDER_ID },
  })
  const session = Array.isArray(sessions) ? sessions[0] : sessions
  const intentId = (session.data as { id?: string })?.id
  if (!intentId) throw new Error("Stripe session has no PaymentIntent id")

  await stripe.paymentIntents.confirm(intentId, {
    payment_method: TEST_PAYMENT_METHOD,
    return_url: "http://localhost:9000",
  })
  logger.info(`Confirmed ${intentId} with ${TEST_PAYMENT_METHOD} (authorized, not captured)`)

  const { result: completion, errors } = await completeCartWithSplitOrdersWorkflow(container).run({
    input: { cart_id: cart.id },
    throwOnError: false,
  })
  if (errors?.length) throw errors[0].error
  const orderGroupId = completion?.order_group_id
  const {
    data: [group],
  } = await query.graph({
    entity: "order_group",
    fields: ["id", "display_id", "orders.id", "orders.display_id", "orders.total", "orders.items.id", "orders.items.quantity"],
    filters: { id: orderGroupId },
  })
  order = group.orders![0] as never
  groupId = group.id
  logger.info(`Order group #${group.display_id}: order #${order.display_id} (${order.id}) total ${order.total} ${region.currency_code}`)

  // 5. fulfil → the group is decided
  await createOrderFulfillmentWorkflow(container).run({
    input: {
      order_id: order.id,
      location_id: locationId,
      items: (order.items ?? []).map((item) => ({ id: item.id, quantity: item.quantity })),
      no_notification: true,
    },
  })
  logger.info(`Fulfilled order #${order.display_id}`)
  }

  // 6. capture
  await run("payout-validate-captures", { order_group_id: groupId })

  // The captured cart payment is split into per-order payments by a subscriber.
  let orderPaymentId: string | null = null
  for (let attempt = 0; attempt < 20 && !orderPaymentId; attempt++) {
    await sleep(1500)
    const {
      data: [fresh],
    } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.payments.id", "payment_collections.payments.captured_at"],
      filters: { id: order.id },
    })
    const payment = (fresh?.payment_collections ?? []).flatMap((c) => c.payments ?? []).find((p) => p.captured_at)
    orderPaymentId = payment?.id ?? null
  }
  if (!orderPaymentId) throw new Error("Order payment was not captured and split in time")
  logger.info(`Order payment ${orderPaymentId} captured`)

  // 7. transfer
  await run("payout-process-transfers", { order_id: order.id })

  // 8. partial refund → reversal
  if (!SKIP_REFUND) {
    const refundAmount = Number(MathBN.convert(MathBN.mult(order.total as never, REFUND_SHARE)).toFixed(2))
    await refundPaymentWorkflow(container).run({
      input: { payment_id: orderPaymentId, amount: refundAmount, note: "Simulated partial refund" },
    })
    logger.info(`Refunded ${refundAmount} ${region.currency_code} on ${orderPaymentId}`)
  }
  await run("payout-process-reversals", { order_id: order.id })

  // 9. settlement + payout
  await run("payout-process-settlements", { seller_id: seller.id })

  // 10. summary
  const payouts = await payoutService.listPayouts({ order_id: order.id }, { relations: ["reversals"] })
  for (const payout of payouts) {
    logger.info(`payout ${payout.id} ${payout.amount} ${payout.currency_code} → ${payout.status}${providerIdOf(payout.data) ? ` ${providerIdOf(payout.data)}` : ""}${payout.status_reason ? ` (${payout.status_reason})` : ""}`)
    for (const reversal of payout.reversals ?? []) {
      logger.info(`  reversal ${reversal.id} ${reversal.amount} → ${reversal.status}${providerIdOf(reversal.data) ? ` ${providerIdOf(reversal.data)}` : ""}${reversal.status_reason ? ` (${reversal.status_reason})` : ""}`)
    }
  }
  const connector = container.resolve(STRIPE_CONNECTOR_MODULE)
  const [settlement] = await connector.listSettlements({ account_id: seller.payout_account.id }, { order: { period_end: "DESC" }, take: 1 })
  if (settlement) {
    logger.info(`settlement ${settlement.id}: payouts ${settlement.payouts_total} − reversals ${settlement.reversals_total} + adjustments ${settlement.adjustments_total} = ${settlement.amount} ${settlement.currency_code} → ${settlement.status}${settlement.provider_payout_id ? ` ${settlement.provider_payout_id}` : ""}${settlement.status_reason ? ` (${settlement.status_reason})` : ""}`)
  }
}
