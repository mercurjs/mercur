import { GUIDE_CUSTOMER, GUIDE_SELLER } from "./credentials"

const GUIDE_SELLER_STORE = GUIDE_SELLER.store

// Places a real order over the store API after the stack is up. The checkout
// endpoints (cart, line items, shipping, payment, complete) are HTTP-only, and
// global-setup has the server URL but not the container, so this drives them
// with fetch using the publishable key + customer token that guide-seed stashed.
// Mirrors the store order integration spec's cart -> complete sequence.

export interface OrderSeedInput {
  publishableKey: string
  customerToken: string
}

interface HasId {
  id: string
}
interface Region extends HasId {
  currency_code: string
}

export async function seedOrder(
  medusaUrl: string,
  input: OrderSeedInput
): Promise<void> {
  const base = medusaUrl.replace(/\/$/, "")
  const headers = {
    "content-type": "application/json",
    "x-publishable-api-key": input.publishableKey,
    authorization: `Bearer ${input.customerToken}`,
  }

  async function req<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    if (!res.ok) {
      throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`)
    }
    return (text ? JSON.parse(text) : {}) as T
  }

  const { regions } = await req<{ regions: Region[] }>(
    "GET",
    "/store/regions?limit=50"
  )
  const region = regions.find((r) => r.currency_code === "usd") ?? regions[0]

  // Pick an offer sold by the demo seller the vendor guides log in as, so the
  // placed order shows up in that seller's panel.
  const { offers } = await req<{
    offers: Array<HasId & { seller?: { name?: string } }>
  }>("GET", "/store/offers?limit=100")
  const offer =
    offers.find((o) => o.seller?.name === GUIDE_SELLER_STORE) ?? offers[0]
  if (!region || !offer) {
    throw new Error("order seed: no usable region or offer found")
  }

  const { cart } = await req<{ cart: HasId }>("POST", "/store/carts", {
    region_id: region.id,
    email: GUIDE_CUSTOMER.email,
    currency_code: "usd",
  })

  await req("POST", `/store/carts/${cart.id}/line-items`, {
    offer_id: offer.id,
    quantity: 1,
  })

  const { shipping_options } = await req<{
    shipping_options: Record<string, HasId[]> | HasId[]
  }>("GET", `/store/shipping-options?cart_id=${cart.id}`)
  const optionGroups = Array.isArray(shipping_options)
    ? [shipping_options]
    : Object.values(shipping_options)
  for (const options of optionGroups) {
    if (options?.length) {
      await req("POST", `/store/carts/${cart.id}/shipping-methods`, {
        option_id: options[0].id,
      })
    }
  }

  const { payment_collection } = await req<{ payment_collection: HasId }>(
    "POST",
    "/store/payment-collections",
    { cart_id: cart.id }
  )
  await req(
    "POST",
    `/store/payment-collections/${payment_collection.id}/payment-sessions`,
    { provider_id: "pp_system_default" }
  )

  const completed = await req<{ type?: string }>(
    "POST",
    `/store/carts/${cart.id}/complete`,
    {}
  )
  if (completed.type !== "order_group") {
    throw new Error(
      `order seed: complete did not produce an order group (${completed.type})`
    )
  }
}
