import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN, Modules } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  cancelOrderWorkflow,
  createCartWorkflow,
  createOrderFulfillmentWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  refundPaymentWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  addSellerShippingMethodToCartWorkflow,
  completeCartWithSplitOrdersWorkflow,
  createCommissionRatesWorkflow,
  createOrderPayoutsWorkflow,
  deleteCommissionRatesWorkflow,
  processPayoutWorkflow,
} from "@mercurjs/core/workflows"
import { PayoutStatus } from "@mercurjs/types"
import { getStripeClient } from "@mercurjs/stripe-connector-plugin/lib/stripe-client"
import { JobTrigger, PAYOUT_JOBS, PayoutJobName } from "@mercurjs/stripe-connector-plugin/types"
import { resolveConnector, resolvePayoutModule } from "@mercurjs/stripe-connector-plugin/utils/payout-module"
import { runJob } from "@mercurjs/stripe-connector-plugin/utils/run-job"
import { jobWorkflow } from "@mercurjs/stripe-connector-plugin/workflows/jobs"

import { requireStripeTestKey } from "./utils/stripe-test-key"

/**
 * Runs the payout scenarios against the Stripe sandbox in USD and prints a
 * PASS/FAIL line per check. Needs the API up (for HTTP checks and webhooks)
 * and scripts/stripe-listen.sh forwarding.
 *
 *   bun --cwd apps/api run stripe:scenarios
 *   ONLY=two-sellers,hold runs a subset; NOTIFICATIONS_LOG=<file> enables the notification checks
 */
const API = process.env.BACKEND_URL ?? "http://localhost:9000"
const ADMIN = { email: process.env.ADMIN_EMAIL ?? "admin@medusa-test.com", password: process.env.ADMIN_PASSWORD ?? "supersecret" }
const SELLER_PASSWORD = "supersecret"
const CURRENCY = "usd"
const PAYMENT_PROVIDER_ID = "pp_stripe-connector_stripe"
const ONLY = process.env.ONLY?.split(",").map((s) => s.trim())

const transferIdOf = (data: unknown) => {
  const d = data as { id?: string; provider?: { id?: string } } | null | undefined
  return d?.provider?.id ?? d?.id ?? null
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const num = (value: unknown) => Number(MathBN.convert(value as never).toFixed(2))

type Check = { scenario: string; name: string; ok: boolean; detail: string }
const results: Check[] = []

type SellerCtx = {
  id: string
  name: string
  email: string
  accountId: string | null
  externalId: string | null
  accountStatus: string | null
  shippingOptionId: string
  locationId: string
  offers: { id: string; variant_id: string }[]
}

type PlacedOrder = { id: string; display_id: number; total: number; seller_id: string; items: { id: string; quantity: number }[] }

export default async function stripeScenarios({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const payoutService = resolvePayoutModule(container)
  const connector = resolveConnector(container)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const regionModule = container.resolve(Modules.REGION)
  const productModule = container.resolve(Modules.PRODUCT)
  const stripe = getStripeClient(requireStripeTestKey())

  const check = (scenario: string, name: string, ok: boolean, detail = "") => {
    results.push({ scenario, name, ok, detail })
    logger.info(`${ok ? "PASS" : "FAIL"}  [${scenario}] ${name}${detail ? `  ${detail}` : ""}`)
  }

  const waitFor = async <T>(fn: () => Promise<T | null | undefined | false>, timeout = 30000, every = 1500) => {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const value = await fn()
      if (value) return value
      await sleep(every)
    }
    return null
  }

  const job = async (name: PayoutJobName, scope: Parameters<typeof jobWorkflow>[2] = {}) =>
    runJob(container, name, JobTrigger.MANUAL, jobWorkflow(name, container, scope))

  // --- environment -------------------------------------------------------

  const regions = await regionModule.listRegions({ currency_code: CURRENCY }, { relations: ["countries", "payment_providers"] })
  const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === "us"))
  if (!region) throw new Error("No USD region covering us")
  if (!region.payment_providers?.some((p) => p.id === PAYMENT_PROVIDER_ID)) {
    await link.create({ [Modules.REGION]: { region_id: region.id }, [Modules.PAYMENT]: { payment_provider_id: PAYMENT_PROVIDER_ID } })
  }
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const [salesChannel] = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" }, { take: 1 })

  const sellerCtx = async (name: string): Promise<SellerCtx> => {
    const {
      data: [seller],
    } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "email", "payout_account.id", "payout_account.status", "payout_account.external_id"],
      filters: { name },
    })
    if (!seller) throw new Error(`Seller ${name} not found`)

    const { data: options } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "seller.id", "service_zone.id", "service_zone.fulfillment_set_id"],
      filters: { name: "Standard Shipping" },
    })
    const option = options.find((o) => o.seller?.id === seller.id)
    if (!option?.service_zone?.id) throw new Error(`${name} has no Standard Shipping`)
    const zones = await fulfillmentModule.listGeoZones({ service_zone_id: option.service_zone.id } as never, { take: null })
    if (!zones.some((z) => z.country_code === "us")) {
      await fulfillmentModule.createGeoZones({ service_zone_id: option.service_zone.id, type: "country", country_code: "us" })
    }

    const { data: locations } = await query.graph({ entity: "stock_locations", fields: ["id", "fulfillment_sets.id"] })
    const locationId = locations.find((l) => (l.fulfillment_sets ?? []).some((fs) => fs?.id === option.service_zone!.fulfillment_set_id))?.id
    if (!locationId) throw new Error(`${name} has no stock location`)
    await link
      .create({ [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id }, [Modules.STOCK_LOCATION]: { stock_location_id: locationId } })
      .catch(() => null)

    const { data: offers } = await query.graph({ entity: "offer", fields: ["id", "variant_id"], filters: { seller_id: seller.id } })
    const variants = await productModule.listProductVariants(
      { id: offers.map((o) => o.variant_id).filter(Boolean) as string[] },
      { relations: ["product"], take: null }
    )
    const published = new Set(variants.filter((v) => v.product?.status === "published").map((v) => v.id))

    return {
      id: seller.id,
      name: seller.name,
      email: seller.email,
      accountId: seller.payout_account?.id ?? null,
      externalId: seller.payout_account?.external_id ?? null,
      accountStatus: seller.payout_account?.status ?? null,
      shippingOptionId: option.id,
      locationId,
      offers: offers.filter((o) => o.variant_id && published.has(o.variant_id)) as { id: string; variant_id: string }[],
    }
  }

  const address = {
    first_name: "Scenario",
    last_name: "Tester",
    address_1: "1 Market St",
    city: "San Francisco",
    province: "ca",
    country_code: "us",
    postal_code: "94105",
  }

  /** Places one order group with an order per seller; the payment is authorized, not captured. */
  const checkout = async (lines: { seller: SellerCtx; quantity?: number }[]) => {
    const { result: cart } = await createCartWorkflow(container).run({
      input: {
        email: "scenarios@example.com",
        region_id: region.id,
        sales_channel_id: salesChannel.id,
        currency_code: CURRENCY,
        shipping_address: address,
        billing_address: address,
      },
    })
    for (const { seller, quantity = 1 } of lines) {
      let added = false
      for (const offer of seller.offers.slice(0, 10)) {
        const { errors } = await addToCartWorkflow(container).run({
          input: { cart_id: cart.id, items: [{ variant_id: offer.variant_id, quantity, offer_id: offer.id, metadata: { offer_id: offer.id } } as never] },
          throwOnError: false,
        })
        if (!errors?.length) {
          added = true
          break
        }
      }
      if (!added) throw new Error(`No ${seller.name} offer could be added to a USD cart`)
    }
    await addSellerShippingMethodToCartWorkflow(container).run({
      input: { cart_id: cart.id, options: lines.map(({ seller }) => ({ id: seller.shippingOptionId })) },
    })
    const { result: collection } = await createPaymentCollectionForCartWorkflow(container).run({ input: { cart_id: cart.id } })
    const { result: sessions } = await createPaymentSessionsWorkflow(container).run({
      input: { payment_collection_id: collection.id, provider_id: PAYMENT_PROVIDER_ID },
    })
    const session = Array.isArray(sessions) ? sessions[0] : sessions
    const intentId = (session.data as { id: string }).id
    await stripe.paymentIntents.confirm(intentId, { payment_method: "pm_card_bypassPending", return_url: API })

    const { result: completion, errors } = await completeCartWithSplitOrdersWorkflow(container).run({
      input: { cart_id: cart.id },
      throwOnError: false,
    })
    if (errors?.length) throw errors[0].error
    const {
      data: [group],
    } = await query.graph({
      entity: "order_group",
      fields: ["id", "display_id", "orders.id", "orders.display_id", "orders.total", "orders.seller.id", "orders.items.id", "orders.items.quantity"],
      filters: { id: completion!.order_group_id },
    })
    const orders: PlacedOrder[] = (group.orders ?? []).map((o) => ({
      id: o!.id,
      display_id: Number(o!.display_id),
      total: num(o!.total),
      seller_id: (o as { seller?: { id: string } }).seller?.id as string,
      items: (o!.items ?? []).map((i) => ({ id: i!.id, quantity: i!.quantity as number })),
    }))
    return { cartId: cart.id, groupId: group.id as string, groupDisplayId: group.display_id, intentId, cartTotal: num(collection.amount), orders }
  }

  const fulfill = async (order: PlacedOrder, seller: SellerCtx) =>
    createOrderFulfillmentWorkflow(container).run({
      input: { order_id: order.id, location_id: seller.locationId, items: order.items, no_notification: true },
    })

  const orderPayment = async (orderId: string) => {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["payment_collections.payments.id", "payment_collections.payments.amount", "payment_collections.payments.captured_at"],
      filters: { id: orderId },
    })
    return (order?.payment_collections ?? []).flatMap((c) => c?.payments ?? []).find((p) => p?.captured_at) ?? null
  }

  const waitOrderPayment = async (orderId: string) => (await waitFor(() => orderPayment(orderId))) as { id: string; amount: unknown } | null

  const payoutOf = async (orderId: string) => {
    const [payout] = await payoutService.listPayouts({ order_id: orderId }, { relations: ["reversals"] })
    return payout ?? null
  }

  const commissionOf = async (order: PlacedOrder) => {
    const { data: lines } = await query.graph({
      entity: "commission_line",
      fields: ["amount", "item_id", "commission_rate_id"],
      filters: { item_id: order.items.map((i) => i.id) },
    })
    return { total: lines.reduce((sum, l) => sum + num(l.amount), 0), lines }
  }

  const transfersFor = async (payoutId: string, destination: string) => {
    const page = await stripe.transfers.list({ destination, limit: 100 })
    return page.data.filter((t) => t.metadata?.payout_id === payoutId)
  }

  const http = async (method: string, path: string, token: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...headers },
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }
    return { status: res.status, json }
  }

  const login = async (actor: "user" | "member", email: string, password: string) => {
    const res = await fetch(`${API}/auth/${actor}/emailpass`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    return ((await res.json()) as { token: string }).token
  }

  const scenario = async (name: string, fn: () => Promise<void>) => {
    if (ONLY && !ONLY.includes(name)) return
    logger.info(`--- ${name}`)
    try {
      await fn()
    } catch (error) {
      check(name, "scenario ran", false, (error as Error).message)
    }
  }

  const sole = await sellerCtx("Sole Society")
  const kickz = await sellerCtx("Kickz Corner")
  const peak = await sellerCtx("Peak & Pace")

  const expectPaidPayout = async (s: string, order: PlacedOrder, seller: SellerCtx) => {
    const { total: commission } = await commissionOf(order)
    const payout = await waitFor(async () => {
      const p = await payoutOf(order.id)
      return p && p.status === PayoutStatus.PAID ? p : null
    })
    const expected = num(order.total - commission)
    check(s, `#${order.display_id} ${seller.name} payout paid`, !!payout, payout ? `${num(payout.amount)} ${CURRENCY}` : `status ${(await payoutOf(order.id))?.status ?? "none"}`)
    if (payout) check(s, `#${order.display_id} payout = total − commission`, num(payout.amount) === expected, `${order.total} − ${commission} = ${expected}, got ${num(payout.amount)}`)
    return payout
  }

  // --- 1. two sellers in one cart -----------------------------------------
  await scenario("two-sellers", async () => {
    const s = "two-sellers"
    const placed = await checkout([{ seller: sole }, { seller: kickz }])
    check(s, "one order per seller", placed.orders.length === 2 && new Set(placed.orders.map((o) => o.seller_id)).size === 2, `group #${placed.groupDisplayId}`)
    const sum = num(placed.orders.reduce((acc, o) => acc + o.total, 0))
    check(s, "order totals add up to the cart payment", sum === placed.cartTotal, `${sum} vs ${placed.cartTotal}`)

    for (const order of placed.orders) await fulfill(order, order.seller_id === sole.id ? sole : kickz)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    const intent = await stripe.paymentIntents.retrieve(placed.intentId)
    check(s, "cart payment captured once in full", intent.status === "succeeded" && intent.amount_received === Math.round(placed.cartTotal * 100), `${intent.amount_received / 100}`)

    const shares: number[] = []
    for (const order of placed.orders) {
      const payment = await waitOrderPayment(order.id)
      check(s, `#${order.display_id} has its own captured payment`, !!payment, payment ? `${num(payment.amount)}` : "missing")
      if (payment) shares.push(num(payment.amount))
    }
    check(s, "payment shares add up to the cart total", num(shares.reduce((a, b) => a + b, 0)) === placed.cartTotal, shares.join(" + "))

    const soleOrder = placed.orders.find((o) => o.seller_id === sole.id)!
    const kickzOrder = placed.orders.find((o) => o.seller_id === kickz.id)!
    const solePayout = await expectPaidPayout(s, soleOrder, sole)
    const kickzPayout = await expectPaidPayout(s, kickzOrder, kickz)

    const kickzPayment = await orderPayment(kickzOrder.id)
    const refund = num(kickzOrder.total * 0.5)
    await refundPaymentWorkflow(container).run({ input: { payment_id: kickzPayment!.id, amount: refund } })
    await job("payout-process-reversals", { order_id: kickzOrder.id })
    const kickzAfter = await waitFor(async () => {
      const p = await payoutOf(kickzOrder.id)
      return p?.reversals?.some((r) => r.status === PayoutStatus.PAID) ? p : null
    })
    const { total: kickzCommission } = await commissionOf(kickzOrder)
    const expectedReversal = num(refund - (refund * kickzCommission) / kickzOrder.total)
    const reversal = kickzAfter?.reversals?.[0]
    check(s, "refund on one order reverses only that seller", !!reversal && num(reversal.amount) === expectedReversal, reversal ? `${num(reversal.amount)} (expected ${expectedReversal})` : "no reversal")
    const soleAfter = await payoutOf(soleOrder.id)
    check(s, "other seller's payout untouched", (soleAfter?.reversals ?? []).length === 0 && num(soleAfter!.amount) === num(solePayout?.amount))
    if (kickzPayout) check(s, "one transfer per payout", (await transfersFor(kickzPayout.id, kickz.externalId!)).length === 1)
  })

  // --- 2. payout held until fulfilment ---------------------------------------
  await scenario("hold", async () => {
    const s = "hold"
    const placed = await checkout([{ seller: sole }])
    const order = placed.orders[0]
    await createOrderPayoutsWorkflow(container).run({ input: { order_ids: [order.id] } })
    const held = await payoutOf(order.id)
    check(s, "unfulfilled order → payout on hold", held?.status === PayoutStatus.ON_HOLD && held.status_reason === "order_not_ready", `${held?.status} ${held?.status_reason}`)

    await job("payout-validate-captures", { order_group_id: placed.groupId })
    const intent = await stripe.paymentIntents.retrieve(placed.intentId)
    check(s, "capture waits for fulfilment", intent.status === "requires_capture", intent.status)

    await fulfill(order, sole)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    await waitOrderPayment(order.id)
    await job("payout-process-transfers", { order_id: order.id })
    await expectPaidPayout(s, order, sole)
  })

  // --- 3. seller whose account is not active -------------------------------
  await scenario("account-not-ready", async () => {
    const s = "account-not-ready"
    if (peak.accountStatus === "active") {
      check(s, "seller has an inactive account", false, `${peak.name} is active; pick another seller`)
      return
    }
    const placed = await checkout([{ seller: peak }])
    const order = placed.orders[0]
    await fulfill(order, peak)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    await waitOrderPayment(order.id)
    await job("payout-process-transfers", { order_id: order.id })
    const payout = await payoutOf(order.id)
    check(s, `${peak.name} (${peak.accountStatus}) → payout on hold`, payout?.status === PayoutStatus.ON_HOLD && !!payout.status_reason?.startsWith("account_"), `${payout?.status} ${payout?.status_reason}`)
  })

  // --- 4. cancellations -------------------------------------------------------
  await scenario("cancel", async () => {
    const s = "cancel"
    const placed = await checkout([{ seller: sole }, { seller: kickz }])
    const soleOrder = placed.orders.find((o) => o.seller_id === sole.id)!
    const kickzOrder = placed.orders.find((o) => o.seller_id === kickz.id)!
    await cancelOrderWorkflow(container).run({ input: { order_id: kickzOrder.id } })
    await fulfill(soleOrder, sole)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    const intent = await stripe.paymentIntents.retrieve(placed.intentId)
    check(s, "one of two orders canceled → only the rest is captured", intent.amount_received === Math.round(soleOrder.total * 100), `${intent.amount_received / 100} of ${placed.cartTotal}`)
    const solePayment = await waitOrderPayment(soleOrder.id)
    check(s, "open order gets its full total of the capture", !!solePayment && num(solePayment.amount) === soleOrder.total, `${num(solePayment?.amount)} of ${soleOrder.total}`)
    // Stripe confirms the capture with payment_intent.succeeded; its handler must not record it again.
    await sleep(15000)
    const {
      data: [cartLink],
    } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["payment_collection.payments.captures.id"],
      filters: { cart_id: placed.cartId },
    })
    const recorded = cartLink.payment_collection?.payments?.[0]?.captures?.length ?? 0
    check(s, "the capture is recorded once", recorded === 1, `${recorded} captures`)
    const charge = await stripe.charges.retrieve(intent.latest_charge as string)
    check(s, "nothing refunded to the customer", charge.amount_refunded === 0, `${charge.amount_refunded / 100} refunded`)
    await job("payout-process-transfers", { order_id: soleOrder.id })
    await createOrderPayoutsWorkflow(container).run({ input: { order_ids: [kickzOrder.id] } })
    const aborted = await payoutOf(kickzOrder.id)
    check(s, "canceled order → payout aborted", aborted?.status === PayoutStatus.ABORTED, `${aborted?.status} ${aborted?.status_reason}`)
    await expectPaidPayout(s, soleOrder, sole)

    const all = await checkout([{ seller: sole }, { seller: kickz }])
    for (const order of all.orders) await cancelOrderWorkflow(container).run({ input: { order_id: order.id } })
    await job("payout-validate-captures", { order_group_id: all.groupId })
    const voided = await waitFor(async () => {
      const pi = await stripe.paymentIntents.retrieve(all.intentId)
      return pi.status === "canceled" ? pi : null
    }, 20000)
    check(s, "every order canceled → authorization released", !!voided, voided ? "canceled" : (await stripe.paymentIntents.retrieve(all.intentId)).status)
  })

  // --- 5+6. provider failure, refund before payout, retry -------------------
  await scenario("failure-retry", async () => {
    const s = "failure-retry"
    const placed = await checkout([{ seller: kickz }])
    const order = placed.orders[0]
    await fulfill(order, kickz)
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const setExternalId = (value: string) => pg.raw("update payout_account set external_id = ? where id = ?", [value, kickz.accountId])
    await setExternalId("acct_doesnotexist000")
    let failed: Awaited<ReturnType<typeof payoutOf>> | null = null
    try {
      await job("payout-validate-captures", { order_group_id: placed.groupId })
      await waitOrderPayment(order.id)
      await job("payout-process-transfers", { order_id: order.id })
      failed = await waitFor(async () => {
        const p = await payoutOf(order.id)
        return p?.status === PayoutStatus.FAILED ? p : null
      }, 20000)
    } finally {
      await setExternalId(kickz.externalId!)
    }
    check(s, "provider error → payout failed with a reason", !!failed && failed.status_reason === "provider_error", `${failed?.status ?? (await payoutOf(order.id))?.status} ${failed?.status_reason ?? ""}`)
    if (!failed) return

    const payment = await orderPayment(order.id)
    const refund = num(order.total * 0.25)
    await refundPaymentWorkflow(container).run({ input: { payment_id: payment!.id, amount: refund } })

    const admin = await login("user", ADMIN.email, ADMIN.password)
    const retry = await http("POST", `/admin/payouts/${failed.id}/retry`, admin)
    check(s, "admin retry accepted", retry.status === 200, `HTTP ${retry.status}`)
    const paid = await waitFor(async () => {
      const p = await payoutOf(order.id)
      return p?.status === PayoutStatus.PAID ? p : null
    })
    const { total: commission } = await commissionOf(order)
    const expected = num(order.total - commission - (refund - (refund * commission) / order.total))
    check(s, "retried payout paid, net of the earlier refund", !!paid && num(paid.amount) === expected, `${num(paid?.amount)} (expected ${expected})`)
    await job("payout-process-reversals", { order_id: order.id })
    const settled = await waitFor(async () => {
      const p = await payoutOf(order.id)
      return (p?.reversals ?? []).every((r) => r.status === PayoutStatus.ABORTED) ? p : null
    }, 20000)
    const reversals = settled?.reversals ?? (await payoutOf(order.id))?.reversals ?? []
    check(s, "refund before the payout is absorbed, not reversed", !!settled && reversals.every((r) => r.status_reason === "refund_absorbed"), reversals.map((r) => `${r.status}/${r.status_reason}`).join(",") || "none")
    const transfers = paid ? await transfersFor(paid.id, kickz.externalId!) : []
    check(s, "exactly one transfer reached Stripe", transfers.length === 1, `${transfers.length}`)

    await processPayoutWorkflow(container).run({ input: { payout_ids: [paid!.id] } })
    await job("payout-process-transfers", { order_id: order.id })
    check(s, "re-processing a paid payout sends nothing", (await transfersFor(paid!.id, kickz.externalId!)).length === 1)
  })

  // --- 7. full refund after payout -------------------------------------------
  await scenario("full-refund", async () => {
    const s = "full-refund"
    const placed = await checkout([{ seller: sole }])
    const order = placed.orders[0]
    await fulfill(order, sole)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    const payment = await waitOrderPayment(order.id)
    await job("payout-process-transfers", { order_id: order.id })
    const payout = await expectPaidPayout(s, order, sole)
    await refundPaymentWorkflow(container).run({ input: { payment_id: payment!.id, amount: order.total } })
    await job("payout-process-reversals", { order_id: order.id })
    const after = await waitFor(async () => {
      const p = await payoutOf(order.id)
      return p?.reversals?.some((r) => r.status === PayoutStatus.PAID) ? p : null
    })
    const reversed = num((after?.reversals ?? []).reduce((sum, r) => sum + num(r.amount), 0))
    check(s, "full refund reverses the whole payout", !!after && reversed === num(payout?.amount), `${reversed} of ${num(payout?.amount)}`)
  })

  // --- 8. authorization about to expire -------------------------------------
  await scenario("expiry", async () => {
    const s = "expiry"
    const placed = await checkout([{ seller: sole }, { seller: kickz }])
    const soleOrder = placed.orders.find((o) => o.seller_id === sole.id)!
    await fulfill(soleOrder, sole)
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    check(s, "half-fulfilled group waits", (await stripe.paymentIntents.retrieve(placed.intentId)).status === "requires_capture")

    const {
      data: [cartLink],
    } = await query.graph({ entity: "cart_payment_collection", fields: ["payment_collection.payments.id"], filters: { cart_id: placed.cartId } })
    const paymentId = cartLink.payment_collection!.payments![0]!.id
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const backdated = new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000)
    await pg.raw("update payment set created_at = ? where id = ?", [backdated, paymentId])
    await job("payout-validate-captures", { order_group_id: placed.groupId })
    const intent = await stripe.paymentIntents.retrieve(placed.intentId)
    check(s, "inside the safety buffer → captured before expiry", intent.status === "succeeded", `${intent.status}, ${intent.amount_received / 100} of ${placed.cartTotal}`)
  })

  // --- 9. commission rules -----------------------------------------------------
  await scenario("commission-rules", async () => {
    const s = "commission-rules"
    const code = `scenario-kickz-fixed-${Date.now()}`
    const { result: rates } = await createCommissionRatesWorkflow(container).run({
      input: [
        {
          name: "Scenario Kickz fixed",
          code,
          type: "fixed",
          value: 4,
          values: [{ currency_code: CURRENCY, amount: 4 }],
          rules: [{ reference: "seller", reference_id: kickz.id }],
        } as never,
      ],
    })
    try {
      const placed = await checkout([{ seller: kickz, quantity: 2 }, { seller: sole }])
      const kickzOrder = placed.orders.find((o) => o.seller_id === kickz.id)!
      const soleOrder = placed.orders.find((o) => o.seller_id === sole.id)!
      const kickzCommission = await commissionOf(kickzOrder)
      check(s, "seller rule wins over the default rate", kickzCommission.lines.every((l) => l.commission_rate_id === rates[0].id), kickzCommission.lines.map((l) => l.commission_rate_id).join(","))
      check(s, "fixed rate charges its amount per line", kickzCommission.total === 4 * kickzOrder.items.length, `${kickzCommission.total} for ${kickzOrder.items.length} line(s)`)
      const soleCommission = await commissionOf(soleOrder)
      check(s, "other seller stays on the default rate", soleCommission.lines.every((l) => l.commission_rate_id !== rates[0].id) && soleCommission.total > 0, `${soleCommission.total}`)
    } finally {
      await deleteCommissionRatesWorkflow(container).run({ input: { ids: rates.map((r) => r.id) } })
    }
  })

  // --- 10. jobs ---------------------------------------------------------------------
  await scenario("jobs", async () => {
    const s = "jobs"
    const admin = await login("user", ADMIN.email, ADMIN.password)
    for (const name of PAYOUT_JOBS) {
      let res = await http("POST", `/admin/stripe/jobs/${name}/run`, admin)
      for (let attempt = 0; res.status === 409 && attempt < 20; attempt++) {
        await sleep(3000)
        res = await http("POST", `/admin/stripe/jobs/${name}/run`, admin)
      }
      const runs = await waitFor(async () => {
        const list = await http("GET", `/admin/stripe/jobs/${name}/runs?limit=1`, admin)
        const run = (list.json.runs as { status: string; trigger: string; error?: string | null }[] | undefined)?.[0]
        return run && run.status !== "running" ? run : null
      }, 60000, 2000)
      check(s, `${name} runs from admin`, res.status < 300 && runs?.status === "succeeded", `HTTP ${res.status}, run ${runs?.status ?? "none"}${runs?.error ? ` (${runs.error})` : ""}`)
    }
    await sleep(5000)
    const [a, b] = await Promise.all([job("payout-process-reversals"), job("payout-process-reversals")])
    check(s, "the same job never runs twice at once", (a === null) !== (b === null), `${a ? a.status : "skipped"} / ${b ? b.status : "skipped"}`)
  })

  // --- 11. alerts ---------------------------------------------------------------------
  await scenario("alerts", async () => {
    const s = "alerts"
    const admin = await login("user", ADMIN.email, ADMIN.password)
    const before = await http("GET", "/admin/stripe/notifications?limit=1&order=-created_at", admin)
    const lastBefore = (before.json.notifications as { id: string }[] | undefined)?.[0]?.id
    const run = await job("payout-alert-failed-operations")
    check(s, "alert job runs with failed operations present", run?.status === "succeeded", JSON.stringify(run?.stats ?? {}))
    const after = await http("GET", "/admin/stripe/notifications?limit=1&order=-created_at", admin)
    const latest = (after.json.notifications as { id: string; type?: string; status?: string }[] | undefined)?.[0]
    const mailed = Number(run?.stats?.sent ?? 0)
    if (mailed > 0) {
      check(s, "the digest is logged", !!latest && latest.id !== lastBefore, latest ? `${latest.type ?? ""} ${latest.status ?? ""}` : `HTTP ${after.status}`)
    } else {
      check(s, "without an email provider the digest is skipped, not failed", run?.status === "succeeded", `sent ${mailed}`)
    }
    const kyc = await job("payout-monitor-kyc")
    check(s, "KYC monitor runs (opt-in)", kyc?.status === "succeeded", JSON.stringify(kyc?.stats ?? {}))
  })

  // --- 12. admin actions --------------------------------------------------------------
  await scenario("admin", async () => {
    const s = "admin"
    const admin = await login("user", ADMIN.email, ADMIN.password)
    const status = await http("GET", "/admin/stripe/status", admin)
    check(s, "status endpoint", status.status === 200, `last webhook ${String((status.json as { last_webhook_at?: string }).last_webhook_at ?? "n/a")}`)

    const adjustment = await http("POST", "/admin/stripe/adjustments", admin, {
      seller_id: sole.id,
      type: "extra_credit",
      amount: 2,
      currency_code: CURRENCY,
      reason: "Scenario admin credit",
    })
    check(s, "create adjustment", adjustment.status === 201, `HTTP ${adjustment.status}`)
    await job("payout-process-settlements", { seller_id: sole.id })
    const adjId = (adjustment.json.adjustment as { id: string } | undefined)?.id
    const adj = adjId ? await connector.retrieveAdjustment(adjId) : null
    check(s, "admin credit dispatched by the settlements run", adj?.status === PayoutStatus.PAID, `${adj?.status} ${adj?.provider_transfer_id ?? adj?.status_reason ?? ""}`)

    const [stuck] = await connector.listSettlements({ status: "failed" }, { take: 1 })
    if (stuck) {
      const retry = await http("POST", `/admin/stripe/settlements/${stuck.id}/retry`, admin)
      check(s, "settlement retry endpoint answers", retry.status < 500, `HTTP ${retry.status} ${String((retry.json as { message?: string }).message ?? "")}`)
    }

    const captures = await http("GET", "/admin/stripe/captures?limit=5", admin)
    check(s, "captures list", captures.status === 200, `${(captures.json.captures as unknown[] | undefined)?.length ?? 0} rows`)

    const placed = await checkout([{ seller: sole }])
    const manual = await http("POST", `/admin/stripe/captures/${placed.groupId}/cancel`, admin)
    const canceled = await waitFor(async () => {
      const pi = await stripe.paymentIntents.retrieve(placed.intentId)
      return pi.status === "canceled" ? pi : null
    }, 15000)
    check(s, "operator cancels an uncaptured group", manual.status < 300 && !!canceled, `HTTP ${manual.status}`)

    const placed2 = await checkout([{ seller: sole }])
    const capture = await http("POST", `/admin/stripe/captures/${placed2.groupId}/capture`, admin)
    const captured = await waitFor(async () => {
      const pi = await stripe.paymentIntents.retrieve(placed2.intentId)
      return pi.status === "succeeded" ? pi : null
    }, 15000)
    check(s, "operator captures ahead of fulfilment", capture.status < 300 && !!captured, `HTTP ${capture.status}`)

    const remap = await http("POST", "/admin/payout-accounts", admin, { seller_id: sole.id, external_id: sole.externalId })
    check(s, "mapping an account onto a seller that has one is refused", remap.status >= 400 && remap.status < 500, `HTTP ${remap.status}`)

    const sync = await http("POST", `/admin/payout-accounts/${kickz.accountId}/sync`, admin)
    check(s, "account sync", sync.status === 200, `HTTP ${sync.status}`)

    const ignore = await http("POST", `/admin/stripe/accounts/${peak.accountId}/ignore`, admin, { ignored: true })
    check(s, "ignore seller", ignore.status < 300, `HTTP ${ignore.status} ${ignore.status >= 300 ? JSON.stringify(ignore.json).slice(0, 120) : ""}`)
    if (ignore.status < 300) await http("POST", `/admin/stripe/accounts/${peak.accountId}/ignore`, admin, { ignored: false })
  })

  // --- 13. vendor isolation --------------------------------------------------------------
  await scenario("vendor-isolation", async () => {
    const s = "vendor-isolation"
    const token = await login("member", kickz.email, SELLER_PASSWORD)
    const as = { "x-seller-id": kickz.id }
    const payouts = await http("GET", "/vendor/payouts?limit=100", token, undefined, as)
    const rows = (payouts.json.payouts as { id: string; order_id: string | null }[] | undefined) ?? []
    const own = await payoutService.listPayouts({ account_id: kickz.accountId! }, { take: null })
    const ownIds = new Set(own.map((p) => p.id))
    check(s, "vendor lists only its own payouts", payouts.status === 200 && rows.length > 0 && rows.every((r) => ownIds.has(r.id)), `${rows.length} rows`)

    const [foreign] = await payoutService.listPayouts({ account_id: sole.accountId! }, { take: 1 })
    const peek = await http("GET", `/vendor/payouts/${foreign.id}`, token, undefined, as)
    check(s, "another seller's payout is not visible", peek.status === 404 || peek.status === 403, `HTTP ${peek.status}`)

    const settlements = await http("GET", "/vendor/stripe/settlements?limit=100", token, undefined, as)
    const srows = (settlements.json.settlements as { id: string }[] | undefined) ?? []
    const ownSettlements = new Set((await connector.listSettlements({ account_id: kickz.accountId! }, { take: null })).map((x) => x.id))
    check(s, "vendor lists only its own settlements", settlements.status === 200 && srows.every((r) => ownSettlements.has(r.id)), `${srows.length} rows`)

    const spoof = await http("GET", "/vendor/payouts?limit=1", token, undefined, { "x-seller-id": sole.id })
    check(s, "member cannot act as another seller (403)", spoof.status === 403 && !("payouts" in spoof.json), `HTTP ${spoof.status} ${String(spoof.json.message ?? "")}`)
  })

  // --- 14. webhook replay and signatures ---------------------------------------------------
  await scenario("webhooks", async () => {
    const s = "webhooks"
    const secret = process.env.STRIPE_SELLERS_WEBHOOK_SECRET!
    const send = async (event: Record<string, unknown>, signed = true) => {
      const payload = JSON.stringify(event)
      const header = signed
        ? stripe.webhooks.generateTestHeaderString({ payload, secret })
        : stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_wrong" })
      const res = await fetch(`${API}/hooks/payout`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": header }, body: payload })
      return res.status
    }
    const accountEvent = (id: string) => ({ id: `evt_scenario_${Date.now()}`, object: "event", type: "account.updated", account: id, created: Math.floor(Date.now() / 1000), data: { object: { id, object: "account" } } })

    const synced = async () => (await payoutService.retrievePayoutAccount(kickz.accountId!)).last_synced_at
    const t0 = await synced()
    await send(accountEvent(kickz.externalId!), false)
    await sleep(9000)
    check(s, "bad signature is ignored", String(await synced()) === String(t0))

    const event = accountEvent(kickz.externalId!)
    await send(event)
    const t1 = await waitFor(async () => {
      const t = await synced()
      return String(t) !== String(t0) ? t : null
    })
    check(s, "signed event is applied", !!t1)
    await send(event)
    const t2 = await waitFor(async () => {
      const t = await synced()
      return String(t) !== String(t1) ? t : null
    })
    const account = await payoutService.retrievePayoutAccount(kickz.accountId!)
    check(s, "replayed event is harmless", account.status === "active", `re-synced: ${!!t2}, status ${account.status}`)

    const [paid] = await payoutService.listPayouts({ account_id: kickz.accountId!, status: PayoutStatus.PAID }, { order: { created_at: "DESC" }, take: 1 })
    const transferId = transferIdOf(paid?.data)
    if (paid && transferId) {
      const transfer = await stripe.transfers.retrieve(transferId)
      await send({ id: `evt_scenario_tr_${Date.now()}`, object: "event", type: "transfer.created", created: Math.floor(Date.now() / 1000), data: { object: transfer } })
      await sleep(9000)
      const again = await payoutService.retrievePayout(paid.id)
      check(s, "replayed transfer.created keeps the payout paid, no new transfer", again.status === PayoutStatus.PAID && (await transfersFor(paid.id, kickz.externalId!)).length === 1)
    }
  })

  // --- 15. operator notifications -------------------------------------------------------------
  await scenario("notifications", async () => {
    const s = "notifications"
    const logFile = process.env.NOTIFICATIONS_LOG
    if (!logFile) {
      check(s, "NOTIFICATIONS_LOG is set", false)
      return
    }
    const fs = await import("node:fs")
    type Received = { signature_ok: boolean; body: { type?: string; payload?: { id?: string } } & Record<string, unknown> }
    const received = (): Received[] =>
      fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l) as Received) : []
    const about = (type: string, id: string) => received().filter((r) => r.body.type === type && r.body.payload?.id === id)
    const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

    // payout.failed, notified once across retries
    const placed = await checkout([{ seller: kickz }])
    const order = placed.orders[0]
    await fulfill(order, kickz)
    const setExternalId = (value: string) => pg.raw("update payout_account set external_id = ? where id = ?", [value, kickz.accountId])
    await setExternalId("acct_doesnotexist000")
    let failedId: string | null = null
    try {
      await job("payout-validate-captures", { order_group_id: placed.groupId })
      await waitOrderPayment(order.id)
      await job("payout-process-transfers", { order_id: order.id })
      const failed = await waitFor(async () => {
        const p = await payoutOf(order.id)
        return p?.status === PayoutStatus.FAILED ? p : null
      }, 20000)
      failedId = failed?.id ?? null
      if (failedId) {
        const first = await waitFor(async () => (about("payout.failed", failedId!).length ? about("payout.failed", failedId!) : null), 20000)
        check(s, "payout.failed delivered", !!first, first ? `signature ${first[0].signature_ok ? "valid" : "INVALID"}` : "nothing received")
        if (first) {
          check(s, "payout.failed is signed", first[0].signature_ok)
          const keys = Object.keys(first[0].body.payload ?? {})
          check(s, "payout.failed carries order, account, seller, amount, reason", ["order_id", "account_id", "seller_id", "amount", "currency_code", "status_reason"].every((k) => keys.includes(k)), keys.join(","))
        }
        await processPayoutWorkflow(container).run({ input: { payout_ids: [failedId] } }).catch(() => null)
        await job("payout-process-transfers", { order_id: order.id })
        await sleep(8000)
        check(s, "a payout that keeps failing notifies once", about("payout.failed", failedId).length === 1, `${about("payout.failed", failedId).length} notifications`)
      } else {
        check(s, "payout failed for the notification test", false, `${(await payoutOf(order.id))?.status}`)
      }
    } finally {
      await setExternalId(kickz.externalId!)
    }
    if (failedId) {
      const admin = await login("user", ADMIN.email, ADMIN.password)
      await http("POST", `/admin/payouts/${failedId}/retry`, admin)
    }

    // payout_reversal.failed: the transfer is already fully reversed in Stripe
    const placed2 = await checkout([{ seller: sole }])
    const order2 = placed2.orders[0]
    await fulfill(order2, sole)
    await job("payout-validate-captures", { order_group_id: placed2.groupId })
    const payment2 = await waitOrderPayment(order2.id)
    await job("payout-process-transfers", { order_id: order2.id })
    const paid2 = await waitFor(async () => {
      const p = await payoutOf(order2.id)
      return p?.status === PayoutStatus.PAID ? p : null
    })
    const transferId = transferIdOf(paid2?.data)
    if (paid2 && transferId) {
      // Point the payout at a transfer Stripe does not know, so the reversal is refused.
      const setTransfer = (id: string) =>
        pg.raw("update payout set data = jsonb_set(data, '{provider,id}', to_jsonb(?::text)) where id = ?", [id, paid2.id])
      await setTransfer("tr_doesnotexist000")
      let reversal: { id: string; status_reason: string | null } | null = null
      try {
        await refundPaymentWorkflow(container).run({ input: { payment_id: payment2!.id, amount: num(order2.total * 0.5) } })
        await job("payout-process-reversals", { order_id: order2.id })
        reversal = await waitFor(async () => {
          const p = await payoutOf(order2.id)
          return p?.reversals?.find((r) => r.status === PayoutStatus.FAILED) ?? null
        }, 20000)
      } finally {
        await setTransfer(transferId)
      }
      check(s, "reversal refused by Stripe → failed", !!reversal, reversal ? `${reversal.status_reason}` : (await payoutOf(order2.id))?.reversals?.map((r) => `${r.status}/${r.status_reason}`).join(",") ?? "none")
      if (reversal) {
        const got = await waitFor(async () => (about("payout_reversal.failed", reversal!.id).length ? about("payout_reversal.failed", reversal!.id) : null), 20000)
        check(s, "payout_reversal.failed delivered", !!got, got ? `signature ${got[0].signature_ok ? "valid" : "INVALID"}` : "nothing received")
        await job("payout-process-reversals", { order_id: order2.id })
        const done = await waitFor(async () => {
          const p = await payoutOf(order2.id)
          return p?.reversals?.find((r) => r.id === reversal!.id && r.status === PayoutStatus.PAID) ?? null
        }, 20000)
        check(s, "failed reversal is retried once the transfer is reachable", !!done, done ? "paid" : (await payoutOf(order2.id))?.reversals?.map((r) => r.status).join(",") ?? "")
      }
    }

    // settlement.payout_failed through the payout.failed webhook
    const [paidOut] = await connector.listSettlements({ status: "paid_out" }, { order: { created_at: "DESC" }, take: 1 })
    if (paidOut?.provider_payout_id) {
      const account = await payoutService.retrievePayoutAccount(paidOut.account_id)
      const payload = JSON.stringify({
        id: `evt_scenario_po_${Date.now()}`,
        object: "event",
        type: "payout.failed",
        account: account.external_id,
        created: Math.floor(Date.now() / 1000),
        data: { object: { id: paidOut.provider_payout_id, object: "payout", status: "failed", failure_code: "account_closed", failure_message: "The bank account has been closed" } },
      })
      const header = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_SELLERS_WEBHOOK_SECRET! })
      await fetch(`${API}/hooks/payout`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": header }, body: payload })
      const failedSettlement = await waitFor(async () => {
        const [fresh] = await connector.listSettlements({ id: paidOut.id })
        return fresh?.payout_status === PayoutStatus.FAILED ? fresh : null
      }, 20000)
      check(s, "payout.failed webhook fails the settlement", !!failedSettlement, failedSettlement ? `${failedSettlement.status} ${failedSettlement.status_reason}` : "unchanged")
      const got = await waitFor(async () => (about("settlement.payout_failed", paidOut.id).length ? about("settlement.payout_failed", paidOut.id) : null), 20000)
      check(s, "settlement.payout_failed delivered", !!got, got ? `reason ${String((got[0].body.payload as Record<string, unknown>).status_reason)}` : "nothing received")
    }

    const [shortBalance] = await connector.listSettlements({ status: "failed", payout_status: PayoutStatus.ON_HOLD }, { take: 1 })
    if (shortBalance) {
      const admin = await login("user", ADMIN.email, ADMIN.password)
      await http("POST", `/admin/stripe/settlements/${shortBalance.id}/retry`, admin)
      await sleep(8000)
      check(s, "settlement held on a short balance notifies", about("settlement.payout_failed", shortBalance.id).length > 0, `${shortBalance.id} ${shortBalance.status_reason}`)
    }
  })

  const failed = results.filter((r) => !r.ok)
  logger.info(`=== ${results.length - failed.length}/${results.length} checks passed`)
  for (const f of failed) logger.info(`FAIL  [${f.scenario}] ${f.name}  ${f.detail}`)
  if (failed.length) process.exitCode = 1
}

