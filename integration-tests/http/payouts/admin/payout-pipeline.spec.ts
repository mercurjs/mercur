import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  MercurModules,
  PayoutJobTrigger,
  PayoutStatus,
  SettlementStatus,
  TransferStatus,
  TransferType,
} from "@mercurjs/types"
import { ensureSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Payout pipeline", () => {
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
          email: "pipeline-seller@test.com",
          name: "Pipeline Seller",
        })
        seller = result.seller
        sellerHeaders = result.headers
      })

      it("lists the system provider in the registry", async () => {
        const response = await api.get("/admin/payout-providers", adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.payout_providers.map((p: any) => p.id)).toContain("pop_system_default")
      })

      it("describes the seven jobs with their schedules", async () => {
        const response = await api.get("/admin/payout-jobs", adminHeaders)
        expect(response.status).toEqual(200)
        const jobs = response.data.jobs.map((j: any) => j.job)
        expect(jobs).toEqual([
          "payout-sync-onboarding",
          "payout-validate-captures",
          "payout-process-transfers",
          "payout-process-reversals",
          "payout-process-settlements",
          "payout-alert-failed-operations",
          "payout-monitor-kyc",
        ])
        const settlements = response.data.jobs.find((j: any) => j.job === "payout-process-settlements")
        expect(settlements.schedule).toEqual("3 1 * * *")
        expect(settlements.enabled).toBe(true)
        expect(settlements.next_run_at).toBeTruthy()
      })

      it("creates a payout account for a new seller when the onboarding job runs", async () => {
        const run = await api.post("/admin/payout-jobs/payout-sync-onboarding/run", { seller_id: seller.id }, adminHeaders)
        expect(run.status).toEqual(200)
        expect(run.data.run.trigger).toEqual(PayoutJobTrigger.MANUAL)
        expect(run.data.run.status).toEqual("succeeded")

        const accounts = await api.get(`/admin/payout-accounts?seller_id=${seller.id}`, adminHeaders)
        expect(accounts.status).toEqual(200)
        expect(accounts.data.count).toEqual(1)
        const account = accounts.data.payout_accounts[0]
        expect(account.provider_id).toEqual("pop_system_default")
        expect(account.status).toEqual("active")
        expect(account.payouts_enabled).toBe(true)
        expect(account.seller.id).toEqual(seller.id)

        const again = await api.post("/admin/payout-jobs/payout-sync-onboarding/run", { seller_id: seller.id }, adminHeaders)
        expect(again.status).toEqual(200)
        const after = await api.get(`/admin/payout-accounts?seller_id=${seller.id}`, adminHeaders)
        expect(after.data.count).toEqual(1)

        const me = await api.get("/vendor/payout-accounts/me", sellerHeaders)
        expect(me.status).toEqual(200)
        expect(me.data.payout_account.id).toEqual(account.id)

        const runs = await api.get("/admin/payout-jobs/payout-sync-onboarding/runs", adminHeaders)
        expect(runs.data.count).toBeGreaterThanOrEqual(2)
      })

      it("refuses a second mapping for a seller that already has an account", async () => {
        await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const response = await api
          .post(
            "/admin/payout-accounts",
            { seller_id: seller.id, provider_id: "pop_system_default", provider_account_id: "acct_x" },
            adminHeaders
          )
          .catch((e: any) => e.response)
        expect(response.status).toEqual(409)
      })

      it("toggles ignored and syncs an account", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const ignored = await api.post(`/admin/payout-accounts/${account_id}/ignore`, { ignored: true }, adminHeaders)
        expect(ignored.data.payout_account.ignored).toBe(true)

        const synced = await api.post(`/admin/payout-accounts/${account_id}/sync`, {}, adminHeaders)
        expect(synced.data.payout_account.kyc_status).toEqual("approved")
        expect(synced.data.payout_account.last_synced_at).toBeTruthy()
      })

      it("turns an adjustment into a transfer, a settlement and a paid payout", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const created = await api.post(
          "/admin/payout-adjustments",
          { seller_id: seller.id, type: "extra_credit", amount: 42, currency_code: "EUR", reason: "Goodwill" },
          adminHeaders
        )
        expect(created.status).toEqual(201)
        expect(created.data.adjustment.account_id).toEqual(account_id)
        expect(created.data.adjustment.currency_code).toEqual("eur")

        const run = await api.post("/admin/payouts/run", { seller_id: seller.id }, adminHeaders)
        expect(run.status).toEqual(200)
        expect(run.data.run.status).toEqual("succeeded")
        expect(run.data.run.stats.adjustments_dispatched).toEqual(1)
        expect(run.data.run.stats.settlements).toEqual(1)
        expect(run.data.run.stats.payouts).toEqual(1)

        const transfers = await api.get(`/admin/transfers?account_id=${account_id}`, adminHeaders)
        expect(transfers.data.count).toEqual(1)
        expect(transfers.data.transfers[0]).toMatchObject({
          type: TransferType.ADJUSTMENT_CREDIT,
          status: TransferStatus.CREATED,
          amount: 42,
        })
        expect(transfers.data.transfers[0].provider_transfer_id).toBeTruthy()

        const settlements = await api.get(`/admin/settlements?account_id=${account_id}`, adminHeaders)
        expect(settlements.data.count).toEqual(1)
        const settlement = settlements.data.settlements[0]
        expect(settlement.display_id).toEqual(expect.any(Number))
        expect(settlement.amount).toEqual(42)
        expect(settlement.adjustments_total).toEqual(42)
        expect(settlement.adjustment_count).toEqual(1)
        expect(settlement.status).toEqual(SettlementStatus.PAID_OUT)
        expect(settlement.seller.id).toEqual(seller.id)
        expect(settlement.payout.status).toEqual(PayoutStatus.PAID)

        const detail = await api.get(`/admin/settlements/${settlement.id}`, adminHeaders)
        expect(detail.data.settlement.display_id).toEqual(settlement.display_id)
        expect(detail.data.settlement.adjustments).toHaveLength(1)
        expect(detail.data.settlement.adjustments[0].transfer_status).toEqual(TransferStatus.CREATED)

        const payouts = await api.get(`/admin/payouts?settlement_id=${settlement.id}`, adminHeaders)
        const bySeller = await api.get(`/admin/payouts?seller_id=${seller.id}&status=paid`, adminHeaders)
        expect(bySeller.data.payouts.map((p: any) => p.id)).toEqual(payouts.data.payouts.map((p: any) => p.id))
        const byOther = await api.get(`/admin/payouts?seller_id=sel_none`, adminHeaders)
        expect(byOther.data.payouts).toEqual([])
        expect(payouts.data.count).toEqual(1)
        expect(payouts.data.payouts[0].provider_payout_id).toBeTruthy()

        const vendorSettlements = await api.get("/vendor/settlements", sellerHeaders)
        expect(vendorSettlements.data.count).toEqual(1)
        expect(vendorSettlements.data.settlements[0].account_id).toBeUndefined()

        const vendorTransfers = await api.get("/vendor/transfers", sellerHeaders)
        expect(vendorTransfers.data.count).toEqual(1)

        const other = await createSellerUser(container, { email: "other-pipeline@test.com", name: "Other" })
        const foreign = await api.get("/vendor/settlements", other.headers)
        expect(foreign.data.count).toEqual(0)

        const rerun = await api.post("/admin/payouts/run", { seller_id: seller.id }, adminHeaders)
        expect(rerun.data.run.stats.settlements).toEqual(0)
        const settlementsAfter = await api.get(`/admin/settlements?account_id=${account_id}`, adminHeaders)
        expect(settlementsAfter.data.count).toEqual(1)
      })

      it("holds the settlement payout while payouts are disabled, then pays it on the next run", async () => {
        const {
          result: { account_id },
        } = await ensureSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        await payoutService.createTransfers({
          account_id,
          provider_id: "pop_system_default",
          type: TransferType.ORDER,
          order_id: "order_fake_1",
          amount: 100,
          currency_code: "usd",
          status: TransferStatus.CREATED,
          provider_transfer_id: "tr_fake",
        })
        await payoutService.updatePayoutAccounts({ id: account_id, payouts_enabled: false })

        const held = await api.post("/admin/payouts/run", { seller_id: seller.id }, adminHeaders)
        expect(held.data.run.stats.on_hold).toEqual(1)
        const [payout] = await payoutService.listPayouts({ account_id })
        expect(payout.status).toEqual(PayoutStatus.ON_HOLD)
        expect(payout.status_reason).toContain("Payouts are disabled")

        await payoutService.updatePayoutAccounts({ id: account_id, payouts_enabled: true })
        const paid = await api.post("/admin/payouts/run", { seller_id: seller.id }, adminHeaders)
        expect(paid.data.run.stats.payouts_retried).toEqual(1)
        const [after] = await payoutService.listPayouts({ account_id })
        expect(after.status).toEqual(PayoutStatus.PAID)
      })

      it("lists pending captures as a paginated collection", async () => {
        const response = await api.get("/admin/payout-captures", adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data).toEqual({ captures: [], count: 0, offset: 0, limit: 20 })
      })

      it("returns 404 for a capture detail that is not pending", async () => {
        const response = await api
          .get("/admin/payout-captures/ogrp_missing", adminHeaders)
          .catch((e: any) => e.response)
        expect(response.status).toEqual(404)
      })

      it("reports status and an empty failed strip", async () => {
        const response = await api.get("/admin/payout-status", adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.failed).toEqual({ captures: 0, transfers: 0, reversals: 0, payouts: 0 })
        expect(response.data.options.settlements.mode).toEqual("connector")
        expect(response.data.jobs).toHaveLength(7)
      })
    })
  },
})
