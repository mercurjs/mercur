import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MercurModules, PayoutStatus, PayoutStatusReason } from "@mercurjs/types"
import {
  createOrRefreshSellerPayoutAccountWorkflow,
  createPayoutsStep,
  processPayoutForWebhookWorkflow,
  processPayoutsStep,
  updatePayoutsStep,
} from "@mercurjs/core/workflows"

import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(180000)

const failAfterSendStep = createStep("test-fail-after-send", async () => {
  throw new Error("fails after the payout was sent")
})

const createSendThenFailWorkflow = createWorkflow(
  "test-create-send-then-fail",
  function (input: { account_id: string }) {
    const created = createPayoutsStep(
      transform({ input }, ({ input }) => [{ account_id: input.account_id, amount: 100, currency_code: "usd" }])
    )
    processPayoutsStep(transform({ created }, ({ created }) => ({ ids: created.map((payout) => payout.id) })))
    failAfterSendStep()

    return new WorkflowResponse(created)
  }
)

const updateSendThenFailWorkflow = createWorkflow(
  "test-update-send-then-fail",
  function (input: { id: string }) {
    const updated = updatePayoutsStep(
      transform({ input }, ({ input }) => [{ id: input.id, status: PayoutStatus.PENDING }])
    )
    processPayoutsStep(transform({ input }, ({ input }) => ({ ids: [input.id] })))
    failAfterSendStep()

    return new WorkflowResponse(updated)
  }
)

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
        const first = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const again = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
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
        await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const response = await api
          .post("/admin/payout-accounts", { seller_id: seller.id, external_id: "acct_x" }, adminHeaders)
          .catch((e: any) => e.response)
        expect(response.status).toEqual(409)
      })

      it("syncs an account from the provider", async () => {
        const {
          result: { account_id },
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

        const synced = await api.post(`/admin/payout-accounts/${account_id}/sync`, {}, adminHeaders)
        expect(synced.data.payout_account.kyc_status).toEqual("approved")
        expect(synced.data.payout_account.last_synced_at).toBeTruthy()
      })

      it("filters payouts by seller, order and status", async () => {
        const {
          result: { account_id },
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
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
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const failed = await createSellerPayout(account_id, {
          status: PayoutStatus.FAILED,
          status_reason: PayoutStatusReason.PROVIDER_ERROR,
          data: { status_detail: "provider down" },
        })

        const response = await api.post(`/admin/payouts/${failed.id}/retry`, {}, adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.payout.status).toEqual(PayoutStatus.PAID)
        expect(response.data.payout.status_reason).toBeNull()
        expect(response.data.payout.data.provider.id).toBeTruthy()
        expect(response.data.payout.data.status_detail).toBeNull()
      })

      it("sends a pending order payout on retry", async () => {
        const {
          result: { account_id },
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const pending = await createSellerPayout(account_id, { order_id: "order_pending", status: PayoutStatus.PENDING })

        const response = await api.post(`/admin/payouts/${pending.id}/retry`, {}, adminHeaders)
        expect(response.status).toEqual(200)
        expect(response.data.payout.status).toEqual(PayoutStatus.PAID)
        expect(response.data.payout.data.provider.id).toBeTruthy()
      })

      it("refuses to retry a paid payout", async () => {
        const {
          result: { account_id },
        } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
        const paid = await createSellerPayout(account_id, { status: PayoutStatus.PAID })

        const response = await api
          .post(`/admin/payouts/${paid.id}/retry`, {}, adminHeaders)
          .catch((e: any) => e.response)
        expect(response.status).toEqual(400)
      })

      describe("payout webhooks", () => {
        it("stores the provider's payout id when a webhook marks the payout paid", async () => {
          const {
            result: { account_id },
          } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
          const processing = await createSellerPayout(account_id, {
            status: PayoutStatus.PROCESSING,
            data: { attempts: 1, idempotency_key: "key_1" },
          })

          await processPayoutForWebhookWorkflow(container).run({
            input: { action: "payout.paid", data: { id: "tr_webhook", payout_id: processing.id } },
          })

          const paid = await payoutService.retrievePayout(processing.id)
          expect(paid.status).toEqual(PayoutStatus.PAID)
          expect(paid.data).toEqual(
            expect.objectContaining({ attempts: 1, idempotency_key: "key_1", provider: { id: "tr_webhook" } })
          )
        })

        it("clears the idempotency key when a webhook fails the payout", async () => {
          const {
            result: { account_id },
          } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
          const processing = await createSellerPayout(account_id, {
            status: PayoutStatus.PROCESSING,
            data: { attempts: 1, idempotency_key: "key_1" },
          })

          await processPayoutForWebhookWorkflow(container).run({
            input: {
              action: "payout.failed",
              data: { id: "tr_webhook", payout_id: processing.id, status_reason: "bank account closed" },
            },
          })

          const failed = await payoutService.retrievePayout(processing.id)
          expect(failed.status).toEqual(PayoutStatus.FAILED)
          expect(failed.status_reason).toEqual(PayoutStatusReason.PROVIDER_ERROR)
          expect(failed.data.status_detail).toEqual("bank account closed")
          expect(failed.data.idempotency_key).toBeNull()
        })
      })

      describe("rollback", () => {
        it("keeps a created payout that was already sent", async () => {
          const {
            result: { account_id },
          } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })

          const { errors } = await createSendThenFailWorkflow(container).run({
            input: { account_id },
            throwOnError: false,
          })
          expect(errors).toHaveLength(1)

          const payouts = await payoutService.listPayouts({ account_id })
          expect(payouts).toHaveLength(1)
          expect(payouts[0].status).toEqual(PayoutStatus.PAID)
        })

        it("does not restore an updated payout that was already sent", async () => {
          const {
            result: { account_id },
          } = await createOrRefreshSellerPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
          const failed = await createSellerPayout(account_id, { status: PayoutStatus.FAILED })

          const { errors } = await updateSendThenFailWorkflow(container).run({
            input: { id: failed.id },
            throwOnError: false,
          })
          expect(errors).toHaveLength(1)

          const payout = await payoutService.retrievePayout(failed.id)
          expect(payout.status).toEqual(PayoutStatus.PAID)
          expect(payout.data.provider.id).toBeTruthy()
        })
      })

      describe("GET /payout/onboarding/refresh", () => {
        const createOnboardingAccount = async () => {
          const account = await payoutService.createPayoutAccounts({ external_id: "acct_onboarding", data: {} })
          await payoutService.createOnboarding({ account_id: account.id })
          return payoutService.retrievePayoutAccount(account.id)
        }

        const refresh = (token: string) =>
          api.get(`/payout/onboarding/refresh?token=${token}`, { maxRedirects: 0, validateStatus: () => true })

        it("rotates the token on every refresh", async () => {
          const account = await createOnboardingAccount()
          expect(account.onboarding_token).toBeTruthy()
          expect(account.onboarding_token_issued_at).toBeTruthy()

          const first = await refresh(account.onboarding_token)
          expect(first.status).toEqual(302)

          const rotated = await payoutService.retrievePayoutAccount(account.id)
          expect(rotated.onboarding_token).toBeTruthy()
          expect(rotated.onboarding_token).not.toEqual(account.onboarding_token)

          const reused = await refresh(account.onboarding_token)
          expect(reused.status).toEqual(404)

          const next = await refresh(rotated.onboarding_token)
          expect(next.status).toEqual(302)
        })

        it("rejects a token older than the TTL", async () => {
          const account = await createOnboardingAccount()
          await payoutService.updatePayoutAccounts({
            id: account.id,
            onboarding_token_issued_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
          })

          const response = await refresh(account.onboarding_token)
          expect(response.status).toEqual(400)
        })

        it("issues a new token for a new link once the old one expired", async () => {
          const account = await createOnboardingAccount()
          await payoutService.updatePayoutAccounts({
            id: account.id,
            onboarding_token_issued_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
          })

          await payoutService.createOnboarding({ account_id: account.id })

          const renewed = await payoutService.retrievePayoutAccount(account.id)
          expect(renewed.onboarding_token).not.toEqual(account.onboarding_token)
          expect((await refresh(renewed.onboarding_token)).status).toEqual(302)
        })
      })
    })
  },
})
