import { createHmac } from "node:crypto"

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { adminHeaders, createAdminUser } from "../../helpers/create-admin-user"
import { createSellerUser } from "../../helpers/create-seller-user"
import { startWebhookReceiver, waitFor, WebhookReceiver } from "./helpers"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Magento connector - webhooks", () => {
      let appContainer: MedusaContainer
      let receiver: WebhookReceiver

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        receiver = await startWebhookReceiver()
      })

      afterEach(async () => {
        await receiver.close()
      })

      it("creates, lists, updates and deletes a webhook endpoint", async () => {
        const created = await api.post(
          `/admin/magento/webhooks`,
          { url: receiver.url, events: ["offer.created"], description: "Magento" },
          adminHeaders
        )
        expect(created.status).toEqual(200)
        expect(created.data.webhook).toEqual(
          expect.objectContaining({
            id: expect.stringMatching(/^mwhe_/),
            url: receiver.url,
            events: ["offer.created"],
            is_active: true,
            secret: expect.any(String),
          })
        )
        const id = created.data.webhook.id

        const listed = await api.get(`/admin/magento/webhooks`, adminHeaders)
        expect(listed.data.webhooks.map((w: any) => w.id)).toContain(id)
        expect(listed.data.webhooks[0].secret).toBeUndefined()

        const updated = await api.post(
          `/admin/magento/webhooks/${id}`,
          { events: ["offer.created", "seller.updated"], is_active: false },
          adminHeaders
        )
        expect(updated.data.webhook.events).toEqual(["offer.created", "seller.updated"])
        expect(updated.data.webhook.is_active).toEqual(false)

        const deleted = await api.delete(`/admin/magento/webhooks/${id}`, adminHeaders)
        expect(deleted.data).toEqual({ id, object: "magento_webhook", deleted: true })
      })

      it("rejects an unknown event", async () => {
        const res = await api
          .post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["cart.exploded"] },
            adminHeaders
          )
          .catch((e: any) => e.response)
        expect(res.status).toEqual(400)
      })

      it("delivers a signed payload when a subscribed event fires", async () => {
        const webhook = (
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["seller.updated"] },
            adminHeaders
          )
        ).data.webhook

        const { seller, headers } = await createSellerUser(appContainer, {
          email: "hooked@test.com",
          name: "Hooked",
        })
        await api.post(`/vendor/sellers/me`, { name: "Hooked Renamed" }, headers)

        await waitFor(() => receiver.received.length > 0)

        const [hit] = receiver.received
        expect(hit.headers["x-mercur-event"]).toEqual("seller.updated")
        expect(hit.headers["x-mercur-delivery"]).toMatch(/^mwhd_/)
        const expected = `sha256=${createHmac("sha256", webhook.secret)
          .update(hit.body)
          .digest("hex")}`
        expect(hit.headers["x-mercur-signature"]).toEqual(expected)

        const body = JSON.parse(hit.body)
        expect(body.event).toEqual("seller.updated")
        expect(body.data).toEqual(expect.objectContaining({ id: seller.id }))

        await waitFor(async () => {
          const { data } = await api.get(
            `/admin/magento/webhooks/${webhook.id}/deliveries`,
            adminHeaders
          )
          return data.deliveries.some((d: any) => d.status === "delivered")
        })
        const { data } = await api.get(
          `/admin/magento/webhooks/${webhook.id}/deliveries?status=delivered`,
          adminHeaders
        )
        expect(data.deliveries[0]).toEqual(
          expect.objectContaining({
            event: "seller.updated",
            attempts: 1,
            response_status: 200,
            next_attempt_at: null,
          })
        )
      })

      it("schedules a retry on failure and redelivers on demand", async () => {
        receiver.respondWith.status = 500

        const webhook = (
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["seller.updated"] },
            adminHeaders
          )
        ).data.webhook

        const { headers } = await createSellerUser(appContainer, {
          email: "retry@test.com",
          name: "Retry",
        })
        await api.post(`/vendor/sellers/me`, { name: "Retry Renamed" }, headers)

        let delivery: any
        await waitFor(async () => {
          const { data } = await api.get(
            `/admin/magento/webhooks/${webhook.id}/deliveries`,
            adminHeaders
          )
          delivery = data.deliveries.find((d: any) => d.status === "failed")
          return !!delivery
        })
        expect(delivery.attempts).toEqual(1)
        expect(delivery.response_status).toEqual(500)
        expect(new Date(delivery.next_attempt_at).getTime()).toBeGreaterThan(Date.now())

        receiver.respondWith.status = 200
        const redelivered = await api.post(
          `/admin/magento/webhooks/${webhook.id}/deliveries/${delivery.id}/redeliver`,
          {},
          adminHeaders
        )
        expect(redelivered.data.delivery).toEqual(
          expect.objectContaining({ status: "delivered", attempts: 2, response_status: 200 })
        )
      })

      it("does not deliver events the endpoint did not subscribe to", async () => {
        await api.post(
          `/admin/magento/webhooks`,
          { url: receiver.url, events: ["offer.created"] },
          adminHeaders
        )
        const { headers } = await createSellerUser(appContainer, {
          email: "silent@test.com",
          name: "Silent",
        })
        await api.post(`/vendor/sellers/me`, { name: "Silent Renamed" }, headers)

        await new Promise((resolve) => setTimeout(resolve, 1500))
        expect(receiver.received).toHaveLength(0)
      })
    })
  },
})
