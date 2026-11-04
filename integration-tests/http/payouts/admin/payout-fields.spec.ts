import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules, PayoutStatus } from "@mercurjs/types"
import { createOrRefreshSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Payout provider data exposure", () => {
      let container: MedusaContainer
      let payoutService: any
      let seller: any
      let accountId: string

      beforeAll(async () => {
        container = getContainer()
        payoutService = container.resolve(MercurModules.PAYOUT)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const result = await createSellerUser(container, {
          email: "payout-fields-seller@test.com",
          name: "Payout Fields Seller",
        })
        seller = result.seller

        const {
          result: { account_id },
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({
          input: { seller_id: seller.id },
        })
        accountId = account_id

        const payout = await payoutService.createPayouts({
          account_id: accountId,
          amount: 100,
          currency_code: "usd",
          status: PayoutStatus.PAID,
          data: { source_payment: { id: "pay_1", data: { id: "pi_secret" } } },
        })
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [MercurModules.PAYOUT]: { payout_id: payout.id },
          [MercurModules.SELLER]: { seller_id: seller.id },
        })
      })

      it("lists payouts without their provider data", async () => {
        const response = await api.get(`/admin/payouts?seller_id=${seller.id}`, adminHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.count).toEqual(1)
        const [payout] = response.data.payouts
        expect(payout.status).toEqual(PayoutStatus.PAID)
        expect(payout).not.toHaveProperty("data")
        expect(JSON.stringify(response.data)).not.toContain("pi_secret")
      })

      it("lists payout accounts without onboarding data", async () => {
        const response = await api.get(`/admin/payout-accounts?seller_id=${seller.id}`, adminHeaders)

        expect(response.status).toEqual(200)
        const [account] = response.data.payout_accounts
        expect(account.id).toEqual(accountId)
        expect(account.onboarding?.data).toBeUndefined()

        const detail = await api.get(`/admin/payout-accounts/${accountId}`, adminHeaders)
        expect(detail.status).toEqual(200)
        expect(detail.data.payout_account.onboarding?.data).toBeUndefined()
      })

      it("returns the seller's payout account without provider payloads", async () => {
        const response = await api.get(`/admin/sellers/${seller.id}`, adminHeaders)

        expect(response.status).toEqual(200)
        const account = response.data.seller.payout_account
        expect(account.id).toEqual(accountId)
        expect(account).not.toHaveProperty("data")
        expect(account.onboarding?.data).toBeUndefined()
      })
    })
  },
})
