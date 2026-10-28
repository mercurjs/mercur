import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  MercurModules,
  PayoutAccountStatus,
  PayoutKycStatus,
  PayoutProviderError,
  PayoutStatus,
} from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createPayoutAccountWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Payout module - processPayout", () => {
      let appContainer: MedusaContainer
      let payoutService: any
      let providerService: any
      let accountId: string

      beforeAll(async () => {
        appContainer = getContainer()
        payoutService = appContainer.resolve(MercurModules.PAYOUT)
        providerService = payoutService.payoutProviderService_
      })

      beforeEach(async () => {
        const { seller } = await createSellerUser(appContainer, {
          email: "payout-module-seller@test.com",
          name: "Payout Module Seller",
        })
        const { result } = await createPayoutAccountWorkflow(appContainer).run({
          input: { seller_id: seller.id, data: {}, context: {} },
        })
        accountId = result.id
      })

      afterEach(() => {
        jest.restoreAllMocks()
      })

      const createPending = () =>
        payoutService.createPayouts({
          account_id: accountId,
          order_id: "order_1",
          amount: 1000,
          currency_code: "usd",
          data: { source_payment: { id: "pay_1", data: { id: "pi_1" } } },
        })

      it("sends the payout with its id as idempotency key and the source payment", async () => {
        let receivedInput: any
        jest.spyOn(providerService, "createPayout").mockImplementation(async (input: any) => {
          receivedInput = input
          return { id: "tr_1", status: PayoutStatus.PAID, data: { id: "tr_1" } }
        })

        const pending = await createPending()
        const payout = await payoutService.processPayout(pending.id)

        expect(receivedInput.context).toEqual({ idempotency_key: pending.id })
        expect(receivedInput.source_payment).toEqual({ id: "pay_1", data: { id: "pi_1" } })
        expect(receivedInput.group).toEqual("order_1")
        expect(receivedInput.metadata).toEqual({ payout_id: pending.id, order_id: "order_1" })

        expect(payout.status).toEqual(PayoutStatus.PAID)
        expect(payout.data).toMatchObject({ attempts: 1, provider: { id: "tr_1" } })
      })

      it("records a provider error on the row and retries with a fresh key", async () => {
        const spy = jest
          .spyOn(providerService, "createPayout")
          .mockRejectedValueOnce(new Error("provider down"))
          .mockResolvedValueOnce({ id: "tr_2", status: PayoutStatus.PAID, data: {} })

        const pending = await createPending()

        const failed = await payoutService.processPayout(pending.id)
        expect(failed.status).toEqual(PayoutStatus.FAILED)
        expect(failed.status_reason).toEqual("provider down")

        const paid = await payoutService.processPayout(pending.id)
        expect(paid.status).toEqual(PayoutStatus.PAID)
        expect(spy.mock.calls[1][0].context).toEqual({ idempotency_key: `${pending.id}:2` })
      })

      it("aborts the payout on a final provider error", async () => {
        jest
          .spyOn(providerService, "createPayout")
          .mockRejectedValue(new PayoutProviderError("account closed", { final: true }))

        const pending = await createPending()
        const payout = await payoutService.processPayout(pending.id)

        expect(payout.status).toEqual(PayoutStatus.ABORTED)
        expect(payout.status_reason).toEqual("account closed")
      })

      it("leaves a paid payout alone", async () => {
        const spy = jest.spyOn(providerService, "createPayout")

        const pending = await createPending()
        await payoutService.updatePayouts({ id: pending.id, status: PayoutStatus.PAID })
        const payout = await payoutService.processPayout(pending.id)

        expect(payout.status).toEqual(PayoutStatus.PAID)
        expect(spy).not.toHaveBeenCalled()
      })

      it("reverses against the provider payout", async () => {
        let receivedInput: any
        jest.spyOn(providerService, "createPayout").mockResolvedValue({
          id: "tr_1",
          status: PayoutStatus.PAID,
          data: { id: "tr_1" },
        })
        jest.spyOn(providerService, "reversePayout").mockImplementation(async (input: any) => {
          receivedInput = input
          return { id: "trr_1", status: PayoutStatus.PAID, data: {} }
        })

        const payout = await payoutService.processPayout((await createPending()).id)
        const pendingReversal = await payoutService.createPayoutReversals({
          payout_id: payout.id,
          refund_id: "ref_1",
          amount: 400,
        })
        const reversal = await payoutService.processPayoutReversal(pendingReversal.id)

        expect(receivedInput.payout).toEqual({ id: "tr_1", data: { id: "tr_1" } })
        expect(Number(receivedInput.amount)).toEqual(400)
        expect(receivedInput.currency_code).toEqual("usd")
        expect(receivedInput.context).toEqual({ idempotency_key: pendingReversal.id })
        expect(reversal.status).toEqual(PayoutStatus.PAID)
        expect(reversal.data.provider.id).toEqual("trr_1")
      })

      describe("updatePayoutAccount", () => {
        const providerAccount = (overrides: Record<string, unknown> = {}) => ({
          id: "acct_1",
          status: PayoutAccountStatus.ACTIVE,
          payouts_enabled: true,
          charges_enabled: true,
          details_submitted: true,
          disabled_reason: null,
          requirements: { currently_due: [], past_due: [], pending_verification: [] },
          data: { id: "acct_1" },
          ...overrides,
        })

        it.each([
          [{ requirements: { currently_due: ["individual.id_number"], past_due: [], pending_verification: [] } }, PayoutKycStatus.PENDING_SUBMISSION],
          [{ requirements: { currently_due: [], past_due: [], pending_verification: ["individual.verification.document"] } }, PayoutKycStatus.PENDING_APPROVAL],
          [{ disabled_reason: "rejected.fraud" }, PayoutKycStatus.REFUSED],
          [{ disabled_reason: "under_review" }, PayoutKycStatus.PENDING_APPROVAL],
          [{}, PayoutKycStatus.APPROVED],
        ])("derives the KYC status from the provider account (%o)", async (overrides, kycStatus) => {
          jest.spyOn(providerService, "retrieveAccount").mockResolvedValue(providerAccount(overrides))

          const account = await payoutService.updatePayoutAccount(accountId)

          expect(account.kyc_status).toEqual(kycStatus)
        })

        it("derives the account status from the provider flags", async () => {
          const retrieve = jest.spyOn(providerService, "retrieveAccount")

          retrieve.mockResolvedValueOnce(providerAccount({ details_submitted: false }))
          expect((await payoutService.updatePayoutAccount(accountId)).status).toEqual(PayoutAccountStatus.PENDING)

          retrieve.mockResolvedValueOnce(providerAccount({ payouts_enabled: false }))
          expect((await payoutService.updatePayoutAccount(accountId)).status).toEqual(PayoutAccountStatus.RESTRICTED)

          retrieve.mockResolvedValueOnce(providerAccount({ disabled_reason: "rejected.terms_of_service" }))
          expect((await payoutService.updatePayoutAccount(accountId)).status).toEqual(PayoutAccountStatus.REJECTED)

          retrieve.mockResolvedValueOnce(providerAccount())
          expect((await payoutService.updatePayoutAccount(accountId)).status).toEqual(PayoutAccountStatus.ACTIVE)
        })
      })
    })
  },
})
