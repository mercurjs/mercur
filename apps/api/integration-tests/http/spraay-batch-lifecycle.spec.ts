import type { Knex } from "@medusajs/framework/mikro-orm/knex"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { keccak256, type Hex } from "viem"

import spraaySettlementReconciler from "../../src/jobs/spraay-settlement-reconciler"
import payoutWebhookHandler from "@mercurjs/core/subscribers/payout-webhook"
import {
  OTHER_KEY,
  PAYOUT_EDITOR,
  TREASURY_OPERATOR,
  adminHeaders,
  chain,
  createAdmin,
  fundTreasury,
  mine,
  payoutModule,
  recipients,
  seedPayouts,
  setUsdcBalance,
  signPrepared,
  spraayTestEnv,
  startGatewayStub,
  treasury,
  usdcBalance,
  usePermissions,
} from "../helpers/spraay"

Object.assign(process.env, spraayTestEnv)
jest.setTimeout(10 * 60 * 1000)

const gateway = startGatewayStub()
beforeAll(() => gateway.start())
afterAll(() => gateway.stop())

const toRaw = (major: number) => BigInt(Math.round(major * 1_000_000))

medusaIntegrationTestRunner({
  inApp: true,
  env: spraayTestEnv,
  testSuite: ({ api, getContainer }) => {
    let container: MedusaContainer
    let snapshot: Hex

    const db = () => container.resolve<Knex>(ContainerRegistrationKeys.PG_CONNECTION)
    const reconcile = () => spraaySettlementReconciler(container)
    const getBatch = async (id: string) => (await api.get(`/admin/spraay/batches/${id}`, adminHeaders)).data.batch
    const payoutsOf = (ids: string[]) => payoutModule(container).listPayouts({ id: ids })
    const failure = (promise: Promise<unknown>) =>
      promise.then(
        () => {
          throw new Error("expected the request to fail")
        },
        (error) => error.response
      )

    const assembleAndPrepare = async (count: number, seed: string, amountFor = (i: number) => (100 + i) / 100) => {
      // Alternate the two accepted labels so every lifecycle test pays a mixed batch.
      const payouts = await seedPayouts(container, recipients(count, seed), amountFor, (i) => (i % 2 ? "usd" : "usdc"))
      const total = payouts.reduce((sum, p) => sum + toRaw(p.amount), 0n)
      await fundTreasury(total * 2n)

      const trigger = await api.post("/admin/spraay/trigger", {}, adminHeaders)
      const batchId: string = trigger.data.batch_id
      expect(batchId).toBeTruthy()

      await api.post(`/admin/spraay/batches/${batchId}/prepare`, {}, adminHeaders)
      return { batchId, payouts, total, batch: await getBatch(batchId) }
    }

    beforeAll(() => {
      container = getContainer()
    })

    beforeEach(async () => {
      snapshot = await chain.test.snapshot()
      gateway.setMode("honest")
      usePermissions(container, TREASURY_OPERATOR)
      await createAdmin(container)
    })

    afterEach(async () => {
      usePermissions(container, null)
      await chain.test.revert({ id: snapshot })
    })

    describe("end to end", () => {
      it("settles 100 payouts in one Spraay transaction and marks them PAID only after on-chain verification", async () => {
        const { batchId, payouts, total, batch } = await assembleAndPrepare(100, `e2e-${Date.now()}`)

        expect(batch.status).toBe("awaiting_signature")
        expect(batch.recipient_count).toBe(100)
        expect(batch.total_amount).toBe(total.toString())
        expect(batch.treasury_address).toBe(treasury.address)
        expect(batch.unsigned_tx_nonce).toBe(await chain.public.getTransactionCount({ address: treasury.address }))
        expect(gateway.requests.at(-1)).toEqual(
          expect.objectContaining({ chain: "base", token: "USDC", sender: treasury.address })
        )

        const raw = await signPrepared(batch)
        const signed = await api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: raw }, adminHeaders)
        expect(signed.data).toEqual({ batch_id: batchId, tx_hash: keccak256(raw), status: "confirming" })

        await reconcile()
        expect((await getBatch(batchId)).status).toBe("confirming")
        expect((await payoutsOf(payouts.map((p) => p.id))).every((p) => p.status === "pending")).toBe(true)

        await mine(10)
        await reconcile()

        const settled = await getBatch(batchId)
        expect(settled.status).toBe("settled")
        expect(settled.tx_hash).toBe(keccak256(raw))
        expect(BigInt(settled.settled_fee_amount)).toBe((total * 30n) / 10_000n)

        const paid = await payoutsOf(payouts.map((p) => p.id))
        expect(paid).toHaveLength(100)
        for (const payout of paid) {
          expect(payout.status).toBe("paid")
          expect(payout.data).toEqual(expect.objectContaining({ tx_hash: settled.tx_hash, batch_id: batchId }))
        }
        for (const p of payouts) {
          expect(await usdcBalance(p.wallet)).toBe(toRaw(p.amount))
        }

        const receipt = await chain.public.getTransactionReceipt({ hash: settled.tx_hash })
        console.info(
          `[100-payout demo] batch ${batchId} tx ${settled.tx_hash} block ${settled.block_number}: ` +
            `100 payouts PAID, ${total} USDC base units + ${settled.settled_fee_amount} fee, gas used ${receipt.gasUsed}`
        )
      })
    })

    describe("signing authority", () => {
      it("refuses to sign when no permissions module is enforcing permissions", async () => {
        const { batchId, batch } = await assembleAndPrepare(2, `noperm-${Date.now()}`)
        usePermissions(container, null)

        const response = await failure(
          api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: await signPrepared(batch) }, adminHeaders)
        )

        expect(response.status).toBe(403)
        expect(response.data).toEqual(expect.objectContaining({ code: "MISSING_PERMISSION", permission: "spraay.sign" }))
        expect((await getBatch(batchId)).status).toBe("awaiting_signature")
      })

      it("refuses payout editors who do not hold spraay.sign", async () => {
        const { batchId, batch } = await assembleAndPrepare(2, `editor-${Date.now()}`)
        usePermissions(container, PAYOUT_EDITOR)

        const response = await failure(
          api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: await signPrepared(batch) }, adminHeaders)
        )

        expect(response.status).toBe(403)
        expect(response.data.permission).toBe("spraay.sign")
      })

      it("still lets payout editors prepare, cancel and trigger", async () => {
        usePermissions(container, PAYOUT_EDITOR)
        const { batchId } = await assembleAndPrepare(2, `editor-ok-${Date.now()}`)

        const canceled = await api.post(`/admin/spraay/batches/${batchId}/cancel`, {}, adminHeaders)
        expect(canceled.data).toEqual({ batch_id: batchId, status: "canceled", payouts_released: false })
      })

      it("rejects a transaction signed by anyone but the treasury", async () => {
        const { batchId, batch } = await assembleAndPrepare(2, `wrong-signer-${Date.now()}`)

        const response = await failure(
          api.post(
            `/admin/spraay/batches/${batchId}/sign`,
            { signed_transaction: await signPrepared(batch, OTHER_KEY) },
            adminHeaders
          )
        )

        expect(response.status).toBe(400)
        expect(response.data.message).toMatch(/signer/)
        expect((await getBatch(batchId)).status).toBe("awaiting_signature")
      })
    })

    describe("gateway", () => {
      it("refuses a gateway transaction that pays a different recipient", async () => {
        const payouts = await seedPayouts(container, recipients(2, `tamper-${Date.now()}`), () => 5)
        const { batch_id } = (await api.post("/admin/spraay/trigger", {}, adminHeaders)).data
        gateway.setMode("tamper")

        const response = await failure(api.post(`/admin/spraay/batches/${batch_id}/prepare`, {}, adminHeaders))

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(response.data.message).toMatch(/recipient #0/)
        const batch = await getBatch(batch_id)
        expect(batch.status).toBe("assembling")
        expect(batch.unsigned_tx_data).toBeNull()
        expect(payouts).toHaveLength(2)
      })

      it("reports x402 Payment Required without preparing the batch", async () => {
        await seedPayouts(container, recipients(2, `x402-${Date.now()}`), () => 5)
        const { batch_id } = (await api.post("/admin/spraay/trigger", {}, adminHeaders)).data
        gateway.setMode("payment-required")

        const response = await failure(api.post(`/admin/spraay/batches/${batch_id}/prepare`, {}, adminHeaders))

        expect(response.data.message).toMatch(/402 Payment Required/)
        expect((await getBatch(batch_id)).status).toBe("assembling")
      })
    })

    describe("duplicate payout protection", () => {
      it("assembles exactly one batch when aggregation runs concurrently", async () => {
        const payouts = await seedPayouts(container, recipients(6, `concurrent-${Date.now()}`), () => 2)

        const results = await Promise.all(
          Array.from({ length: 5 }, () => api.post("/admin/spraay/trigger", {}, adminHeaders))
        )

        const created = results.map((r) => r.data.batch_id).filter(Boolean)
        expect(created).toHaveLength(1)
        const items = await db()("spraay_batch_item").whereIn(
          "payout_id",
          payouts.map((p) => p.id)
        )
        expect(items).toHaveLength(6)
        expect(new Set(items.map((i: { payout_id: string }) => i.payout_id)).size).toBe(6)
      })

      it("accepts a signed transaction once and refuses a second submission", async () => {
        const { batchId, batch } = await assembleAndPrepare(2, `dupe-${Date.now()}`)
        const raw = await signPrepared(batch)

        await api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: raw }, adminHeaders)
        const second = await failure(
          api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: raw }, adminHeaders)
        )

        expect(second.status).toBe(409)
        expect(await chain.public.getTransactionCount({ address: treasury.address })).toBe(batch.unsigned_tx_nonce + 1)
      })

      it("recovers a batch whose server died between recording and broadcasting", async () => {
        const { batchId, batch, payouts } = await assembleAndPrepare(3, `crash-${Date.now()}`)
        const raw = await signPrepared(batch)

        // What the sign route has persisted at the moment sendRawTransaction would run.
        await db()("spraay_batch")
          .where("id", batchId)
          .update({ status: "broadcasting", signed_tx_raw: raw, tx_hash: keccak256(raw), signed_at: new Date() })

        await reconcile()
        expect((await getBatch(batchId)).status).toBe("confirming")

        await mine(10)
        await reconcile()

        expect((await getBatch(batchId)).status).toBe("settled")
        expect((await payoutsOf(payouts.map((p) => p.id))).every((p) => p.status === "paid")).toBe(true)
      })

      it("settles on a replacement transaction instead of releasing already-paid payouts", async () => {
        const { batchId, batch, payouts } = await assembleAndPrepare(3, `replace-${Date.now()}`)
        const original = await signPrepared(batch)

        await chain.test.setAutomine(false)
        try {
          await api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: original }, adminHeaders)

          // The operator "speeds up" the same call from their wallet: same nonce, new hash.
          const { maxFeePerGas } = await chain.public.estimateFeesPerGas()
          const replacement = await signPrepared(batch, undefined, { maxFeePerGas: maxFeePerGas * 10n })
          await chain.public.sendRawTransaction({ serializedTransaction: replacement })
          await mine(1)
        } finally {
          await chain.test.setAutomine(true)
        }

        await mine(12)
        await reconcile()

        const settled = await getBatch(batchId)
        expect(settled.status).toBe("settled")
        expect(settled.tx_hash).not.toBe(keccak256(original))
        expect((await payoutsOf(payouts.map((p) => p.id))).every((p) => p.status === "paid")).toBe(true)
        expect(await db()("spraay_batch_item").where("batch_id", batchId).whereNotNull("released_at")).toHaveLength(0)
      })
    })

    describe("never releasing payouts that may still execute", () => {
      it("releases payouts after an on-chain revert and lets them be rebatched", async () => {
        const { batchId, batch, payouts } = await assembleAndPrepare(2, `revert-${Date.now()}`)
        await setUsdcBalance(treasury.address, 0n)

        await api.post(`/admin/spraay/batches/${batchId}/sign`, { signed_transaction: await signPrepared(batch) }, adminHeaders)
        await mine(10)
        await reconcile()

        const failed = await getBatch(batchId)
        expect(failed.status).toBe("failed")
        expect(failed.error_message).toMatch(/reverted/)
        expect(failed.items.every((item: { released_at: string | null }) => item.released_at)).toBe(true)
        expect((await payoutsOf(payouts.map((p) => p.id))).every((p) => p.status === "pending")).toBe(true)

        const rebatched = await api.post("/admin/spraay/trigger", {}, adminHeaders)
        const next = await getBatch(rebatched.data.batch_id)
        expect(next.items.map((i: { payout_id: string }) => i.payout_id).sort()).toEqual(payouts.map((p) => p.id).sort())
      })

      it("holds a canceled prepared batch until its nonce is used elsewhere, then releases it", async () => {
        const { batchId, batch } = await assembleAndPrepare(2, `held-${Date.now()}`)

        const canceled = await api.post(`/admin/spraay/batches/${batchId}/cancel`, {}, adminHeaders)
        expect(canceled.data.payouts_released).toBe(false)

        await reconcile()
        expect((await api.post("/admin/spraay/trigger", {}, adminHeaders)).data.batch_id).toBeNull()

        const hash = await chain.wallet.sendTransaction({ to: treasury.address, value: 0n, nonce: batch.unsigned_tx_nonce })
        await chain.public.waitForTransactionReceipt({ hash })
        await reconcile()
        expect((await getBatch(batchId)).items.some((i: { released_at: string | null }) => !i.released_at)).toBe(true)

        await mine(10)
        await reconcile()

        const released = await getBatch(batchId)
        expect(released.status).toBe("canceled")
        expect(released.items.every((i: { released_at: string | null }) => i.released_at)).toBe(true)
        expect((await api.post("/admin/spraay/trigger", {}, adminHeaders)).data.batch_id).toBeTruthy()
      })

      it("releases an unprepared batch as soon as its signing window expires", async () => {
        await seedPayouts(container, recipients(2, `expire-${Date.now()}`), () => 3)
        const { batch_id } = (await api.post("/admin/spraay/trigger", {}, adminHeaders)).data
        await db()("spraay_batch").where("id", batch_id).update({ expires_at: new Date(Date.now() - 1000) })

        await reconcile()

        const expired = await getBatch(batch_id)
        expect(expired.status).toBe("expired")
        expect(expired.items.every((i: { released_at: string | null }) => i.released_at)).toBe(true)
      })
    })

    describe("payout webhooks", () => {
      it("cannot mark a Spraay payout PAID without settlement verification", async () => {
        const [payout] = await seedPayouts(container, recipients(1, `webhook-${Date.now()}`), () => 7)

        await payoutWebhookHandler({
          container,
          event: {
            name: "payout.webhook_received",
            data: {
              data: { action: "payout.paid", data: { id: payout.id } },
              rawData: Buffer.from(JSON.stringify({ action: "payout.paid", data: { id: payout.id } })),
              headers: {},
            },
          },
        } as unknown as Parameters<typeof payoutWebhookHandler>[0])

        const [after] = await payoutsOf([payout.id])
        expect(after.status).toBe("pending")
      })
    })
  },
})
