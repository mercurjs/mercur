import { PayoutAccountStatus, PayoutStatus, TransferStatus } from "@mercurjs/types"

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
    },
    accountLinks: { create: record("accountLinks.create", { url: "https://connect.stripe.com/setup", expires_at: 1_700_000_000 }) },
    transfers: {
      create: record("transfers.create", { id: "tr_1" }),
      createReversal: record("transfers.createReversal", { id: "trr_1" }),
    },
    payouts: { create: record("payouts.create", { id: "po_1", status: "pending" }) },
    charges: { retrieve: record("charges.retrieve", { id: "ch_1", amount: 25800, currency: "eur", balance_transaction: { currency: "eur", amount: 25800 } }) },
    balance: { retrieve: record("balance.retrieve", { available: [{ currency: "eur", amount: 100000 }] }) },
    paymentIntents: { retrieve: record("paymentIntents.retrieve", { id: "pi_1", status: "succeeded", latest_charge: "ch_from_pi" }) },
    webhooks: { constructEvent: (raw: string) => JSON.parse(raw) },
  }
}

const build = () => {
  const calls: Call[] = []
  const service = new StripeConnectPayoutProviderService({}, { apiKey: "sk_test_x", webhookSecret: "whsec_x" })
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
    const { service, calls } = build()
    const out = await service.createAccount({
      country: "DE",
      business_type: "company",
      metadata: { seller_id: "sel_1" },
      settings: { manual_payouts: true },
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

  it("transfers with the charge as source_transaction, resolving a PaymentIntent when needed", async () => {
    const { service, calls } = build()
    await service.createTransfer({
      account,
      amount: 162,
      currency_code: "eur",
      source_payment: { id: "pay_1", provider_id: "pp_x", data: { id: "pi_1", latest_charge: "ch_1" } },
      transfer_group: "order_1",
      metadata: { transfer_id: "trf_1" },
      context: { idempotency_key: "trf_1" },
    })
    expect(calls[0].method).toBe("charges.retrieve")
    expect(calls[1].method).toBe("transfers.create")
    expect(calls[1].args[0]).toMatchObject({ amount: 16200, currency: "eur", destination: "acct_seller", source_transaction: "ch_1", transfer_group: "order_1" })

    calls.length = 0
    await service.createTransfer({
      account,
      amount: 10,
      currency_code: "eur",
      source_payment: { id: "pay_2", provider_id: "pp_x", data: { id: "pi_1" } },
    })
    expect(calls[0].method).toBe("paymentIntents.retrieve")
    expect(calls[2].args[0]).toMatchObject({ source_transaction: "ch_from_pi" })
  })

  it("reverses, debits and pays out on the connected account", async () => {
    const { service, calls } = build()
    const reversal = await service.reverseTransfer({ transfer: { id: "tr_1", data: {} }, amount: 54, currency_code: "eur", context: { idempotency_key: "trf_2" } })
    expect(calls[0].method).toBe("transfers.createReversal")
    expect(calls[0].args[0]).toBe("tr_1")
    expect(calls[0].args[1]).toMatchObject({ amount: 5400 })
    expect(reversal.status).toBe(TransferStatus.CREATED)

    calls.length = 0
    await service.createAccountDebit({ account, amount: 29, currency_code: "eur" })
    expect(calls[0].method).toBe("accounts.retrieve")
    expect(calls[1].method).toBe("transfers.create")
    expect(calls[1].args[0]).toMatchObject({ amount: 2900, destination: "acct_platform" })
    expect(calls[1].args[1]).toMatchObject({ stripeAccount: "acct_seller" })

    calls.length = 0
    const payout = await service.createPayout({ account, amount: 79, currency_code: "eur", context: { idempotency_key: "pout_1" } })
    expect(calls[0].method).toBe("balance.retrieve")
    expect(calls[1].method).toBe("payouts.create")
    expect(calls[1].args[0]).toMatchObject({ amount: 7900, currency: "eur" })
    expect(calls[1].args[1]).toMatchObject({ stripeAccount: "acct_seller", idempotencyKey: "pout_1" })
    expect(payout.status).toBe(PayoutStatus.PROCESSING)
  })

  it("normalizes account and payout webhooks", async () => {
    const { service } = build()
    const hook = (event: unknown) => service.getWebhookActionAndData({ data: {}, rawData: JSON.stringify(event), headers: { "stripe-signature": "sig" } })

    const rejected = await hook({ type: "account.updated", data: { object: { id: "acct_1", details_submitted: true, requirements: { disabled_reason: "rejected.fraud" } } } })
    expect(rejected).toEqual({ action: "account.rejected", data: { id: "acct_1" } })

    const active = await hook({ type: "account.updated", data: { object: { id: "acct_2", details_submitted: true, charges_enabled: true, payouts_enabled: true, requirements: {} } } })
    expect(active.action).toBe("account.activated")

    const restricted = await hook({ type: "account.updated", data: { object: { id: "acct_3", details_submitted: true, charges_enabled: true, payouts_enabled: false, requirements: { currently_due: ["doc"] } } } })
    expect(restricted.action).toBe("account.restricted")

    const failed = await hook({ type: "payout.failed", data: { object: { id: "po_1", failure_code: "account_closed", failure_message: "The bank account has been closed" } } })
    expect(failed).toEqual({ action: "payout.failed", data: { id: "po_1", status_reason: "account_closed: The bank account has been closed" } })

    const other = await hook({ type: "charge.succeeded", data: { object: {} } })
    expect(other.action).toBe("not_supported")
  })
})
