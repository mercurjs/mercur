import { createServer, IncomingMessage, Server } from "node:http"
import { AddressInfo } from "node:net"

import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export type ReceivedWebhook = {
  headers: IncomingMessage["headers"]
  body: string
}

export type WebhookReceiver = {
  url: string
  received: ReceivedWebhook[]
  respondWith: { status: number }
  close: () => Promise<void>
}

export const startWebhookReceiver = async (): Promise<WebhookReceiver> => {
  const received: ReceivedWebhook[] = []
  const respondWith = { status: 200 }

  const server: Server = createServer((req, res) => {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk
    })
    req.on("end", () => {
      received.push({ headers: req.headers, body })
      res.statusCode = respondWith.status
      res.end("ok")
    })
  })

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}/webhook`,
    received,
    respondWith,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

export const waitFor = async (
  predicate: () => boolean | Promise<boolean>,
  { timeoutMs = 15000, intervalMs = 200 } = {}
) => {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error("Timed out waiting for condition")
}

const address = {
  first_name: "Buyer",
  last_name: "Test",
  address_1: "123 Main St",
  city: "New York",
  country_code: "us",
  postal_code: "10001",
}

export const completeExternalCheckout = async (opts: {
  container: MedusaContainer
  api: any
  storeHeaders: any
  regionId: string
  salesChannelId: string
  offerIds: string[]
  email: string
  reference: string
  channel?: string
  captured?: boolean
}) => {
  const { api, storeHeaders } = opts

  const cart = (
    await api.post(
      `/store/carts`,
      {
        region_id: opts.regionId,
        sales_channel_id: opts.salesChannelId,
        currency_code: "usd",
        metadata: { channel: opts.channel ?? "magento" },
      },
      storeHeaders
    )
  ).data.cart

  for (const offerId of opts.offerIds) {
    await api.post(
      `/store/carts/${cart.id}/line-items`,
      { offer_id: offerId, quantity: 1 },
      storeHeaders
    )
  }

  await api.post(
    `/store/carts/${cart.id}`,
    { email: opts.email, shipping_address: address, billing_address: address },
    storeHeaders
  )

  const shippingOptions = Object.values(
    (await api.get(`/store/shipping-options?cart_id=${cart.id}`, storeHeaders))
      .data.shipping_options as Record<string, any[]>
  ).flat()
  for (const option of shippingOptions) {
    await api.post(
      `/store/carts/${cart.id}/shipping-methods`,
      { option_id: option.id },
      storeHeaders
    )
  }

  const paymentCollection = (
    await api.post(`/store/payment-collections`, { cart_id: cart.id }, storeHeaders)
  ).data.payment_collection
  await api.post(
    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
    {
      provider_id: "pp_external_external",
      data: {
        reference: opts.reference,
        channel: opts.channel ?? "magento",
        ...(opts.captured ? { captured_at: new Date().toISOString() } : {}),
      },
    },
    storeHeaders
  )

  const completed = (
    await api.post(`/store/carts/${cart.id}/complete`, {}, storeHeaders)
  ).data

  const query = opts.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: groups } = await query.graph({
    entity: "order_group",
    filters: { id: completed.order_group.id },
    fields: ["id", "metadata", "orders.id", "orders.metadata", "orders.seller.id"],
  })

  return { cart, completed, orderGroup: groups[0] as any }
}
