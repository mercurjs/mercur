/** These scripts move real money on whatever account the key belongs to. */
export function requireStripeTestKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  if (!/^(sk|rk)_test_/.test(key)) {
    throw new Error("Refusing to run against a live Stripe key")
  }
  return key
}
