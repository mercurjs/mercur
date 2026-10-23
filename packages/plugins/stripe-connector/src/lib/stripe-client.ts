import Stripe from "stripe"

const clients = new Map<string, Stripe>()

/** One Stripe SDK instance per API key, shared by the payment and payout providers. */
export function getStripeClient(apiKey: string): Stripe {
  let client = clients.get(apiKey)
  if (!client) {
    client = new Stripe(apiKey, { appInfo: { name: "Mercur Stripe connector" } })
    clients.set(apiKey, client)
  }
  return client
}
