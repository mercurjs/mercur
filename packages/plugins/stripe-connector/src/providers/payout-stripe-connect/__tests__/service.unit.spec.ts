import { PayoutAccountStatus, PayoutProviderError, PayoutProviderErrorCode, PayoutStatus } from "@mercurjs/types"

import { StripeConnectPayoutProviderService } from "../service"

type Call = { method: string; args: unknown[] }

const makeStripe = (calls: Call[]) => {
  const record =
    (method: string, result: unknown) =>
    (...args: unknown[]) => {
      calls.push({ method, args })
      return Promise.resolve(result)
    }
  return {
    accounts: {
      create: record("accounts.create", { id: "acct_new", details_submitted: false, charges_enabled: false, payouts_enabled: false, requirements: { currently_due: ["x"], past_due: [], pending_verification: [] } }),
      update: record("accounts.update", { id: "acct_seller" }),
      retrieve: record("accounts.retrieve", { id: "acct_platform", details_submitted: true, charges_enabled: true, payouts_enabled: true, requirements: {} }),
      list: record("accounts.list", { data: [], has_more: false }),
      createLoginLink: record("accounts.createLoginLink", { url: "https://connect.stripe.com/express/login" }),
      del: record("accounts.del", { id: "acct_seller", deleted: true }),
    },
    accountLinks: { create: record("accountLinks.create", { url: "https://connect.stripe.com/setup", expires_at: 1_700_000_000 }) },
    transfers: {
      create: record("transfers.create", { id: "tr_1" }),
      createReversal: record("transfers.createReversal", { id: "trr_1" }),
      retrieve: record("transfers.retrieve", { id: "tr_1", amount: 16200, amount_reversed: 0 }),
      listReversals: (...args: unknown[]) => {
        calls.push({ method: "transfers.listReversals", args })
        return (async function* (): AsyncGenerator<{ id: string; metadata: Record<string, string> }> {})()
      },
    },
    payouts: { create: record("payouts.create", { id: "po_1", status: "pending" }) },
    refunds: { retrieve: record("refunds.retrieve", { id: "pyr_1", balance_transaction: { currency: "pln", net: -6900 } }) },
    charges: { retrieve: record("charges.retrieve", { id: "ch_1", amount: 25800, currency: "eur", balance_transaction: { currency: "eur", amount: 25800 } }) },
    balance: { retrieve: record("balance.retrieve", { available: [{ currency: "eur", amount: 100000 }] }) },
    paymentIntents: { retrieve: record("paymentIntents.retrieve", { id: "pi_1", status: "succeeded", latest_charge: "ch_from_pi" }) },
    webhooks: { constructEvent: (raw: string) => JSON.parse(raw) },
  }
}

const build = (options: { manualPayouts?: boolean } = {}) => {
  const calls: Call[] = []
  const service = new StripeConnectPayoutProviderService({}, { apiKey: "sk_test_x", webhookSecret: "whsec_x", ...options })
  ;(service as unknown as { stripe_: unknown }).stripe_ = makeStripe(calls)
  return { service, calls }
}

const account = { id: "acct_seller", data: {} }

describe("StripeConnectPayoutProviderService", () => {
  it("refuses to start without an api key or webhook secret", () => {
    expect(() => new StripeConnectPayoutProviderService({}, { apiKey: "", webhookSecret: "x" })).toThrow()
    expect(() => new StripeConnectPayoutProviderService({}, { apiKey: "x", webhookSecret: "" })).toThrow()
  })

  it("creates an express account with a manual payout schedule when asked", async () => {
    const { service, calls } = build({ manualPayouts: true })
    const out = await service.createAccount({
      country: "DE",
      business_type: "company",
      metadata: { seller_id: "sel_1" },
      context: { idempotency_key: "pacc_1" },
    })
    expect(calls[0].method).toBe("accounts.create")
    expect(calls[0].args[0]).toMatchObject({ type: "express", country: "DE", business_type: "company", capabilities: { card_payments: { requested: true }, transfers: { requested: true } }, settings: { payouts: { debit_negative_balances: false, schedule: { interval: "manual" } } } })
    expect(calls[0].args[1]).toEqual({ idempotencyKey: "pacc_1" })
    expect(out.status).toBe(PayoutAccountStatus.PENDING)
    expect(out.requirements.currently_due).toEqual(["x"])
  })

  it("creates onboarding and login links", async () => {
    const { service, calls } = build()
    const link = await service.createOnboarding({ account, refresh_url: "https://api/refresh", return_url: "https://vendor/stripe" })
    expect(calls[0].method).toBe("accounts.update")
    expect(calls[0].args[1]).toEqual({ capabilities: { card_payments: { requested: true }, transfers: { requested: true } } })
    expect(calls[1].args[0]).toMatchObject({ account: "acct_seller", refresh_url: "https://api/refresh", return_url: "https://vendor/stripe", type: "account_onboarding" })
    expect(link.url).toContain("setup")
    calls.length = 0
    await service.createOnboarding({ account: { id: "acct_seller", data: { capabilities: { transfers: "active" } } }, refresh_url: "r", return_url: "u" })
    expect(calls[0].method).toBe("accountLinks.create")
    const login = await service.createLoginLink({ account })
    expect(calls[1].method).toBe("accounts.createLoginLink")
    expect(login.url).toContain("login")
  })

  it("pays out as a transfer with the charge as source_transaction, resolving a PaymentIntent when needed", async () => {
    const { service, calls } = build()
    const payout = await service.createPayout({
      account,
      amount: 162,
      currency_code: "eur",
      source_payment: { id: "pay_1", data: { id: "pi_1", latest_charge: "ch_1" } },
      group: "order_1",
      metadata: { payout_id: "pout_1" },
      context: { idempotency_key: "pout_1" },
    })
    expect(payout.status).toBe(PayoutStatus.PAID)
    expect(calls[0].method).toBe("charges.retrieve")
    expect(calls[1].method).toBe("transfers.create")
    expect(calls[1].args[0]).toMatchObject({ amount: 16200, currency: "eur", destination: "acct_seller", source_transaction: "ch_1" })
    expect(calls[1].args[0]).not.toHaveProperty("transfer_group")

    calls.length = 0
    await service.createPayout({
      account,
      amount: 10,
      currency_code: "eur",
      source_payment: { id: "pay_2", data: { id: "pi_1" } },
    })
    expect(calls[0].method).toBe("paymentIntents.retrieve")
    expect(calls[2].args[0]).toMatchObject({ source_transaction: "ch_from_pi" })
  })

  it("records what the transfer and its reversal moved on the connected balance", async () => {
    const { service, calls } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    stripe.transfers.create = (...args: unknown[]) => {
      calls.push({ method: "transfers.create", args })
      return Promise.resolve({ id: "tr_1", destination_payment: "py_1" })
    }
    stripe.charges.retrieve = (...args: unknown[]) => {
      calls.push({ method: "charges.retrieve", args })
      return Promise.resolve(
        args[0] === "py_1"
          ? { id: "py_1", balance_transaction: { currency: "pln", net: 69400 } }
          : { id: "ch_1", amount: 16200, currency: "eur", balance_transaction: { currency: "eur", amount: 16200 } }
      )
    }
    const payout = await service.createPayout({
      account,
      amount: 162,
      currency_code: "eur",
      source_payment: { id: "pay_1", data: { id: "pi_1", latest_charge: "ch_1" } },
    })
    expect(payout.data).toMatchObject({ landed_amount: 694, landed_currency: "pln" })
    expect(calls.find((c) => c.args[0] === "py_1")?.args[2]).toEqual({ stripeAccount: "acct_seller" })

    stripe.transfers.retrieve = () => Promise.resolve({ id: "tr_1", amount: 16200, amount_reversed: 0, destination: "acct_seller" })
    stripe.transfers.createReversal = () => Promise.resolve({ id: "trr_1", destination_payment_refund: "pyr_1" })
    const reversal = await service.reversePayout({ payout: { id: "tr_1", data: {} }, amount: 16.2, currency_code: "eur" })
    expect(reversal.data).toMatchObject({ landed_amount: 69, landed_currency: "pln" })
  })

  it("converts a cross-currency payout at the captured amount's rate", async () => {
    const { service, calls } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    stripe.charges.retrieve = (...args: unknown[]) => {
      calls.push({ method: "charges.retrieve", args })
      return Promise.resolve({ id: "ch_1", amount: 20000, amount_captured: 10000, currency: "eur", balance_transaction: { currency: "usd", amount: 11000 } })
    }
    await service.createPayout({
      account,
      amount: 80,
      currency_code: "eur",
      source_payment: { id: "pay_1", data: { id: "pi_1", latest_charge: "ch_1" } },
    })
    expect(calls[1].args[0]).toMatchObject({ amount: 8800, currency: "usd" })
  })

  it("reverses a payout on its transfer", async () => {
    const { service, calls } = build()
    const reversal = await service.reversePayout({ payout: { id: "tr_1", data: {} }, amount: 54, currency_code: "eur", context: { idempotency_key: "pourev_1" } })
    const create = calls.find((call) => call.method === "transfers.createReversal")
    expect(create?.args[0]).toBe("tr_1")
    expect(create?.args[1]).toMatchObject({ amount: 5400 })
    expect(create?.args[2]).toEqual({ idempotencyKey: "pourev_1" })
    expect(reversal.status).toBe(PayoutStatus.PAID)
  })

  it("caps a reversal at what is left on the transfer", async () => {
    const { service, calls } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    stripe.transfers.retrieve = () => Promise.resolve({ id: "tr_1", amount: 10000, amount_reversed: 9950 })
    await service.reversePayout({ payout: { id: "tr_1", data: {} }, amount: 1, currency_code: "eur" })
    const create = calls.find((call) => call.method === "transfers.createReversal")
    expect(create?.args[1]).toMatchObject({ amount: 50 })
  })

  it("refuses to reverse a transfer that is already fully reversed", async () => {
    const { service, calls } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    stripe.transfers.retrieve = () => Promise.resolve({ id: "tr_1", amount: 10000, amount_reversed: 10000 })
    const error = await service
      .reversePayout({ payout: { id: "tr_1", data: {} }, amount: 1, currency_code: "eur" })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(PayoutProviderError)
    expect((error as PayoutProviderError).final).toBe(true)
    expect(calls.some((call) => call.method === "transfers.createReversal")).toBe(false)
  })

  it("returns the reversal a previous attempt already created", async () => {
    const { service, calls } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    stripe.transfers.listReversals = () =>
      (async function* () {
        yield { id: "trr_other", metadata: { payout_reversal_id: "pourev_0" } }
        yield { id: "trr_done", metadata: { payout_reversal_id: "pourev_1" } }
      })()
    const reversal = await service.reversePayout({
      payout: { id: "tr_1", data: {} },
      amount: 54,
      currency_code: "eur",
      metadata: { payout_id: "pout_1", payout_reversal_id: "pourev_1" },
    })
    expect(reversal.id).toBe("trr_done")
    expect(calls.some((call) => call.method === "transfers.createReversal")).toBe(false)
  })

  it("tells a definitive Stripe refusal from an unknown outcome", async () => {
    const { service } = build()
    const stripe = (service as unknown as { stripe_: ReturnType<typeof makeStripe> }).stripe_
    const fail = (error: Record<string, unknown>) => {
      stripe.transfers.create = () => Promise.reject(Object.assign(new Error("stripe"), error))
      return service
        .createPayout({ account, amount: 10, currency_code: "eur" })
        .then(() => {
          throw new Error("expected a refusal")
        })
        .catch((e: unknown) => e as PayoutProviderError & { type: string })
    }

    const refused = await fail({ type: "StripeInvalidRequestError", statusCode: 400, code: "balance_insufficient" })
    expect(refused.code).toBe(PayoutProviderErrorCode.REFUSED)
    expect(refused.type).toBe("StripeInvalidRequestError")

    expect((await fail({ type: "StripeConnectionError" })).code).toBe(PayoutProviderErrorCode.UNKNOWN)
    expect((await fail({ type: "StripeAPIError", statusCode: 500 })).code).toBe(PayoutProviderErrorCode.UNKNOWN)
    expect((await fail({ type: "StripeRateLimitError", statusCode: 429 })).code).toBe(PayoutProviderErrorCode.UNKNOWN)
    expect((await fail({ type: "StripeInvalidRequestError", statusCode: 409 })).code).toBe(PayoutProviderErrorCode.UNKNOWN)
  })

  it("deletes a connected account", async () => {
    const { service, calls } = build()
    await service.deleteAccount({ account })
    expect(calls[0]).toEqual({ method: "accounts.del", args: ["acct_seller"] })
  })

  it("normalizes account and transfer webhooks", async () => {
    const { service } = build()
    const hook = (event: unknown) => service.getWebhookActionAndData({ data: {}, rawData: JSON.stringify(event), headers: { "stripe-signature": "sig" } })

    const rejected = await hook({ type: "account.updated", data: { object: { id: "acct_1", details_submitted: true, requirements: { disabled_reason: "rejected.fraud" } } } })
    expect(rejected).toEqual({ action: "account.rejected", data: { id: "acct_1" } })

    const active = await hook({ type: "account.updated", data: { object: { id: "acct_2", details_submitted: true, charges_enabled: true, payouts_enabled: true, requirements: {} } } })
    expect(active.action).toBe("account.activated")

    const restricted = await hook({ type: "account.updated", data: { object: { id: "acct_3", details_submitted: true, charges_enabled: true, payouts_enabled: false, requirements: { currently_due: ["doc"] } } } })
    expect(restricted.action).toBe("account.restricted")

    const paid = await hook({ type: "transfer.created", data: { object: { id: "tr_1" } } })
    expect(paid).toEqual({ action: "payout.paid", data: { id: "tr_1" } })

    const reversed = await hook({ type: "transfer.reversed", data: { object: { id: "tr_1" } } })
    expect(reversed).toEqual({ action: "payout.reversed", data: { id: "tr_1" } })

    const foreign = await hook({ type: "transfer.created", account: "acct_other", data: { object: { id: "tr_9", metadata: { payout_id: "pout_1" } } } })
    expect(foreign.action).toBe("not_supported")

    const bank = await hook({ type: "payout.failed", data: { object: { id: "po_1" } } })
    expect(bank.action).toBe("not_supported")

    const other = await hook({ type: "charge.succeeded", data: { object: {} } })
    expect(other.action).toBe("not_supported")
  })
})
