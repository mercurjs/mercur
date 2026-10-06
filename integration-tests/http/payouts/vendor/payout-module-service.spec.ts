import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules, PayoutStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createPayoutAccountWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("Payout module - createPayouts", () => {
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

      it("inserts the row before calling the provider and passes its id as idempotency_key", async () => {
        let visibleDuringProviderCall: any[] = []
        let receivedInput: any

        jest
          .spyOn(providerService, "createPayout")
          .mockImplementation(async (input: any) => {
            receivedInput = input
            visibleDuringProviderCall = await payoutService.listPayouts({
              account_id: accountId,
            })
            return { status: PayoutStatus.PAID, data: { transfer_id: "tr_1" } }
          })

        const payout = await payoutService.createPayouts({
          account_id: accountId,
          amount: 1000,
          currency_code: "usd",
          data: { order_id: "order_1" },
        })

        expect(visibleDuringProviderCall).toHaveLength(1)
        expect(visibleDuringProviderCall[0].id).toEqual(payout.id)
        expect(visibleDuringProviderCall[0].status).toEqual(PayoutStatus.PENDING)

        expect(receivedInput.context).toEqual({ idempotency_key: payout.id })
        expect(receivedInput.data).toMatchObject({ order_id: "order_1" })

        expect(payout.status).toEqual(PayoutStatus.PAID)
        expect(payout.data).toEqual({ transfer_id: "tr_1" })
      })

      it("keeps the caller's idempotency_key when one is passed", async () => {
        let receivedInput: any
        jest
          .spyOn(providerService, "createPayout")
          .mockImplementation(async (input: any) => {
            receivedInput = input
            return { status: PayoutStatus.PAID, data: {} }
          })

        await payoutService.createPayouts({
          account_id: accountId,
          amount: 1000,
          currency_code: "usd",
          context: { idempotency_key: "order_abc" },
        })

        expect(receivedInput.context.idempotency_key).toEqual("order_abc")
      })

      it("leaves no payout row and rethrows when the provider fails", async () => {
        jest
          .spyOn(providerService, "createPayout")
          .mockRejectedValue(new Error("provider down"))

        await expect(
          payoutService.createPayouts({
            account_id: accountId,
            amount: 1000,
            currency_code: "usd",
          })
        ).rejects.toThrow("provider down")

        const payouts = await payoutService.listPayouts(
          { account_id: accountId },
          { withDeleted: true }
        )
        expect(payouts).toHaveLength(0)
      })

    })
  },
})
