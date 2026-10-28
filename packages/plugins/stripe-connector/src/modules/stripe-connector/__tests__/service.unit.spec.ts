import { PayoutStatus } from "@mercurjs/types"

import {
  AdjustmentDTO,
  AdjustmentType,
  INSUFFICIENT_BALANCE_REASON,
  SettlementDTO,
  SettlementStatus,
  resolveStripeConnectorOptions,
} from "../../../types/common"
import StripeConnectorModuleService from "../service"

type Call = { method: string; args: unknown[] }

type Internals = {
  options_: ReturnType<typeof resolveStripeConnectorOptions>
  stripe_: () => unknown
  nextAttempt_: (status: PayoutStatus, providerId: string | null, data: Record<string, unknown> | null) => number | null
  createSettlementPayoutFromProvider_: (settlement: SettlementDTO, account: string, attempt: number) => Promise<unknown>
  processAdjustmentFromProvider_: (adjustment: AdjustmentDTO, account: string, attempt: number) => Promise<unknown>
}

const build = (available: { currency: string; amount: number }[], payouts: { create: (...args: unknown[]) => Promise<unknown> }) => {
  const calls: Call[] = []
  const service = Object.create(StripeConnectorModuleService.prototype) as Internals
  service.options_ = resolveStripeConnectorOptions({ apiKey: "sk_test_x" })
  const stripe = {
    balance: {
      retrieve: (...args: unknown[]) => {
        calls.push({ method: "balance.retrieve", args })
        return Promise.resolve({ available })
      },
    },
    payouts: {
      create: (...args: unknown[]) => {
        calls.push({ method: "payouts.create", args })
        return payouts.create(...args)
      },
    },
    transfers: {
      create: (...args: unknown[]) => {
        calls.push({ method: "transfers.create", args })
        return payouts.create(...args)
      },
    },
    accounts: { retrieve: () => Promise.resolve({ id: "acct_platform" }) },
  }
  service.stripe_ = () => stripe
  return { service, calls }
}

const settlement = {
  id: "stl_1",
  amount: 100,
  currency_code: "EUR",
  payout_status: PayoutStatus.PENDING,
  status: SettlementStatus.OPEN,
  provider_payout_id: null,
  data: null,
} as unknown as SettlementDTO

const adjustment = {
  id: "adj_1",
  account_id: "pacc_1",
  type: AdjustmentType.EXTRA_CREDIT,
  amount: 10,
  currency_code: "eur",
  data: null,
} as unknown as AdjustmentDTO

const stripeError = (type: string, statusCode?: number) => Object.assign(new Error(type), { type, statusCode })

describe("StripeConnectorModuleService", () => {
  describe("bank payout of a settlement", () => {
    it("pays out in the settlement currency when the balance covers it", async () => {
      const { service, calls } = build([{ currency: "eur", amount: 20000 }], {
        create: () => Promise.resolve({ id: "po_1", status: "pending" }),
      })
      const outcome = await service.createSettlementPayoutFromProvider_(settlement, "acct_1", 1)
      expect(calls[1].args[0]).toMatchObject({ amount: 10000, currency: "eur" })
      expect(calls[1].args[1]).toEqual({ idempotencyKey: "stl_1", stripeAccount: "acct_1" })
      expect(outcome).toMatchObject({ status: PayoutStatus.PROCESSING, provider_id: "po_1" })
    })

    it("holds the payout when the settlement currency balance is short, whatever else is available", async () => {
      const { service, calls } = build(
        [
          { currency: "eur", amount: 5000 },
          { currency: "usd", amount: 900000 },
        ],
        { create: () => Promise.resolve({ id: "po_1", status: "pending" }) }
      )
      const outcome = await service.createSettlementPayoutFromProvider_(settlement, "acct_1", 1)
      expect(calls.some((call) => call.method === "payouts.create")).toBe(false)
      expect(outcome).toEqual({
        status: PayoutStatus.ON_HOLD,
        status_reason: INSUFFICIENT_BALANCE_REASON,
      })
    })

    it("marks a definitive refusal failed and leaves an unknown outcome processing", async () => {
      const refused = build([{ currency: "eur", amount: 20000 }], {
        create: () => Promise.reject(stripeError("StripeInvalidRequestError", 400)),
      })
      expect(await refused.service.createSettlementPayoutFromProvider_(settlement, "acct_1", 1)).toMatchObject({
        status: PayoutStatus.FAILED,
      })

      for (const error of [
        stripeError("StripeConnectionError"),
        stripeError("StripeAPIError", 500),
        stripeError("StripeRateLimitError", 429),
        stripeError("StripeInvalidRequestError", 409),
      ]) {
        const transient = build([{ currency: "eur", amount: 20000 }], { create: () => Promise.reject(error) })
        expect(typeof (await transient.service.createSettlementPayoutFromProvider_(settlement, "acct_1", 1))).toBe(
          "string"
        )
      }
    })
  })

  describe("adjustments", () => {
    it("sends the transfer under the attempt's idempotency key", async () => {
      const { service, calls } = build([], { create: () => Promise.resolve({ id: "tr_1" }) })
      const outcome = await service.processAdjustmentFromProvider_(adjustment, "acct_1", 3)
      expect(calls[0].args[1]).toEqual({ idempotencyKey: "adj_1:3" })
      expect(outcome).toMatchObject({ status: PayoutStatus.PAID, provider_id: "tr_1" })
    })

    it("keeps an unknown outcome processing", async () => {
      const { service } = build([], { create: () => Promise.reject(stripeError("StripeAPIError", 502)) })
      expect(typeof (await service.processAdjustmentFromProvider_(adjustment, "acct_1", 1))).toBe("string")
    })
  })

  describe("idempotency key attempts", () => {
    const { service } = build([], { create: () => Promise.resolve({}) })

    it("resends a processing row with the same attempt", () => {
      expect(service.nextAttempt_(PayoutStatus.PROCESSING, null, { attempts: 2 })).toBe(2)
      expect(service.nextAttempt_(PayoutStatus.PROCESSING, null, null)).toBe(1)
    })

    it("moves to a new attempt after a refusal or a hold", () => {
      expect(service.nextAttempt_(PayoutStatus.FAILED, null, { attempts: 2 })).toBe(3)
      expect(service.nextAttempt_(PayoutStatus.ON_HOLD, null, { attempts: 1 })).toBe(2)
      expect(service.nextAttempt_(PayoutStatus.PENDING, null, null)).toBe(1)
    })

    it("never resends what the provider accepted", () => {
      expect(service.nextAttempt_(PayoutStatus.PROCESSING, "po_1", { attempts: 1 })).toBeNull()
      expect(service.nextAttempt_(PayoutStatus.PAID, "po_1", { attempts: 1 })).toBeNull()
      expect(service.nextAttempt_(PayoutStatus.ABORTED, null, null)).toBeNull()
    })
  })
})
