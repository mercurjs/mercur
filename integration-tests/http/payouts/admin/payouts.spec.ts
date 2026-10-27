import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules, PayoutStatus } from "@mercurjs/types"
import { ensureSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Payouts", () => {
      let container: MedusaContainer
      let payoutService: any
      let seller: any
      let sellerHeaders: any

      beforeAll(async () => {
        container = getContainer()
        payoutService = container.resolve(MercurModules.PAYOUT)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, container)
        const result = await createSellerUser(container, {
          email: "admin-payouts-seller@test.com",
          name: "Admin Payouts Seller",
        })
        seller = result.seller
        sellerHeaders = result.headers
      })

      const createSellerPayout = async (accountId: string, input: Record<string, unknown> = {}) => {
        const payout = await payoutService.createPayouts({
          account_id: accountId,
          amount: 100,
          currency_code: "usd",
          ...input,
        })
        await container.resolve(ContainerRegistrationKeys.LINK).create({
          [MercurModules.PAYOUT]: { payout_id: payout.id },
          [MercurModules.SELLER]: { seller_id: seller.id },
        })
        return payout
      }

      it("creates one account per seller and exposes it to the vendor", async () => {
        const first = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const again = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        expect(again.result.account_id).toEqual(first.result.account_id)

        const accounts = await api.get(`/admin/payout-accounts?seller_id=${seller.id}`, adminHeaders)
        expect(accounts.status).toEqual(200)
        expect(accounts.data.count).toEqual(1)
        const account = accounts.data.payout_accounts[0]
        expect(account.provider_id).toBeUndefined()
        expect(account.status).toEqual("active")
        expect(account.payouts_enabled).toBe(true)
        expect(account.seller.id).toEqual(seller.id)

        const me = await api.get("/vendor/payout-accounts/me", sellerHeaders)
        expect(me.status).toEqual(200)
        expect(me.data.payout_account.id).toEqual(account.id)
      })

      it("refuses a second mapping for a seller that already has an account", async () => {
        await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const response = await api
          .post("/admin/payout-accounts", { seller_id: seller.id, external_id: "acct_x" }, adminHeaders)
          .catch((e: any) => e.response)
        expect(response.status).toEqual(409)
      })

      it("syncs an account from the provider", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const synced = await api.post(`/admin/payout-accounts/${account_id}/sync`, {}, adminHeaders)
        expect(synced.data.payout_account.kyc_status).toEqual("approved")
        expect(synced.data.payout_account.last_synced_at).toBeTruthy()
      })

      it("filters payouts by seller, order and status", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const paid = await createSellerPayout(account_id, { order_id: "order_a", status: PayoutStatus.PAID })
        await createSellerPayout(account_id, { order_id: "order_b", status: PayoutStatus.ON_HOLD })

        const bySeller = await api.get(`/admin/payouts?seller_id=${seller.id}`, adminHeaders)
        expect(bySeller.data.count).toEqual(2)

        const byOrder = await api.get(`/admin/payouts?order_id=order_a`, adminHeaders)
        expect(byOrder.data.payouts.map((p: any) => p.id)).toEqual([paid.id])
        expect(byOrder.data.payouts[0].seller.id).toEqual(seller.id)

        const byStatus = await api.get(`/admin/payouts?seller_id=${seller.id}&status=paid`, adminHeaders)
        expect(byStatus.data.payouts.map((p: any) => p.id)).toEqual([paid.id])

        const byOther = await api.get(`/admin/payouts?seller_id=sel_none`, adminHeaders)
        expect(byOther.data.payouts).toEqual([])
      })

      it("retries a failed payout", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const failed = await createSellerPayout(account_id, {
          status: PayoutStatus.FAILED,
          status_reason: "provider down",
        })

        const response = await api.post(`/admin/payouts/${failed.id}/retry`, {}, adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.payout.status).toEqual(PayoutStatus.PAID)
        expect(response.data.payout.status_reason).toBeNull()
        expect(response.data.payout.data.provider.id).toBeTruthy()
      })

      it("refuses to retry a paid payout", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const paid = await createSellerPayout(account_id, { status: PayoutStatus.PAID })

        const response = await api
          .post(`/admin/payouts/${paid.id}/retry`, {}, adminHeaders)
          .catch((e: any) => e.response)
        expect(response.status).toEqual(400)
      })
    })
  },
})
