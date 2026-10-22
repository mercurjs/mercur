import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IRegionModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"
import { createCustomerUser } from "../../helpers/create-customer-user"
import { seedSellerOfferWithShipping } from "../../helpers/split-order-checkout"
import { completeExternalCheckout, startWebhookReceiver, waitFor, WebhookReceiver } from "./helpers"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Magento connector - external payment provider", () => {
      let appContainer: MedusaContainer
      let storeHeaders: any
      let customerEmail: string
      let region: any
      let salesChannel: any
      let seedA: any
      let seedB: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const customer = await createCustomerUser(appContainer, {
          email: "magento-buyer@test.com",
          first_name: "Magento",
          last_name: "Buyer",
        })
        customerEmail = customer.customer.email!
        const apiKey = await generatePublishableKey(appContainer)
        storeHeaders = {
          headers: {
            ...generateStoreHeaders({ publishableKey: apiKey }).headers,
            ...customer.headers.headers,
          },
        }

        salesChannel = await appContainer
          .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
          .createSalesChannels({ name: "Magento" })
        region = await appContainer
          .resolve<IRegionModuleService>(Modules.REGION)
          .createRegions({ name: "US", currency_code: "usd", countries: ["us"] })

        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.REGION]: { region_id: region.id },
          [Modules.PAYMENT]: { payment_provider_id: "pp_external_external" },
        })

        seedA = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "magento-seller-a@test.com",
          name: "MagentoA",
          stocked: 10,
          offerPrice: 2500,
        })
        seedB = await seedSellerOfferWithShipping({
          container: appContainer,
          api,
          salesChannelId: salesChannel.id,
          email: "magento-seller-b@test.com",
          name: "MagentoB",
          stocked: 10,
          offerPrice: 1500,
        })
      })

      const checkout = (reference = "MIR$000001", captured = false) =>
        completeExternalCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId: region.id,
          salesChannelId: salesChannel.id,
          offerIds: [seedA.offer.id, seedB.offer.id],
          email: customerEmail,
          reference,
          captured,
        })

      const getOrder = async (orderId: string, fields = "id,payment_status") =>
        (await api.get(`/admin/orders/${orderId}?fields=${fields}`, adminHeaders)).data.order

      // The order reports the cart payment as captured before the split hands it
      // a payment collection of its own, which refunds need.
      const waitForSplitCapture = (orderId: string) =>
        waitFor(async () => {
          const order = await getOrder(orderId, "id,payment_status,*payment_collections")
          return (
            order.payment_status === "captured" &&
            !!order.payment_collections?.[0]?.metadata?.cart_payment_collection_id
          )
        })

      const captureGroup = (orderGroupId: string, body: Record<string, unknown> = {}) =>
        api.post(`/admin/magento/order-groups/${orderGroupId}/payments/capture`, body, adminHeaders)

      const cancelGroup = (orderGroupId: string, body: Record<string, unknown> = {}) =>
        api.post(`/admin/magento/order-groups/${orderGroupId}/payments/cancel`, body, adminHeaders)

      it("completes a two-seller cart on the external provider and carries the channel onto the order group", async () => {
        const { completed, orderGroup } = await checkout()

        expect(completed.type).toEqual("order_group")
        expect(orderGroup.metadata).toEqual({ channel: "magento" })
        expect(orderGroup.orders).toHaveLength(2)
        for (const order of orderGroup.orders) {
          expect(order.metadata).toEqual({ channel: "magento" })
        }

        const { data } = await api.get(
          `/admin/order-groups/${orderGroup.id}?fields=id,metadata`,
          adminHeaders
        )
        expect(data.order_group.metadata).toEqual({ channel: "magento" })
      })

      it("leaves each child order authorized until the storefront reports the capture", async () => {
        const { orderGroup } = await checkout("MIR$000002")

        for (const order of orderGroup.orders) {
          const data = await getOrder(
            order.id,
            "id,payment_status,*payment_collections,*payment_collections.payments"
          )
          expect(data.payment_status).toEqual("authorized")

          const payments = data.payment_collections.flatMap((pc: any) => pc.payments)
          expect(payments).toHaveLength(1)
          expect(payments[0].provider_id).toEqual("pp_external_external")
          expect(payments[0].captured_at).toBeNull()
          expect(payments[0].data).toEqual(
            expect.objectContaining({ reference: "MIR$000002", channel: "magento" })
          )
          expect(payments[0].data.authorized_at).toBeTruthy()
        }
      })

      it("captures the group payment so each child order is paid and commission lines exist", async () => {
        const receiver: WebhookReceiver = await startWebhookReceiver()
        try {
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["order.payment_captured"] },
            adminHeaders
          )

          const { orderGroup } = await checkout("MIR$000012")

          const captured = await captureGroup(orderGroup.id, { reference: "INV-1" })
          expect(captured.status).toEqual(200)
          expect(captured.data.payment.provider_id).toEqual("pp_external_external")
          expect(captured.data.payment.captured_at).toBeTruthy()

          for (const order of orderGroup.orders) {
            await waitForSplitCapture(order.id)

            const data = await getOrder(
              order.id,
              "id,payment_status,total,*payment_collections,*payment_collections.payments"
            )
            const payments = data.payment_collections.flatMap((pc: any) => pc.payments)
            expect(payments.length).toBeGreaterThan(0)
            expect(payments[0].provider_id).toEqual("pp_external_external")
            expect(payments[0].captured_at).toBeTruthy()
            expect(payments[0].data).toEqual(
              expect.objectContaining({ reference: "MIR$000012", channel: "magento" })
            )

            const lines = await api.get(`/admin/orders/${order.id}/commission-lines`, adminHeaders)
            expect(lines.status).toEqual(200)
            expect(Array.isArray(lines.data.commission_lines)).toBe(true)
          }

          await waitFor(() => receiver.received.length > 0)
          const body = JSON.parse(receiver.received[0].body)
          expect(body.event).toEqual("order.payment_captured")
          expect(body.data).toEqual(
            expect.objectContaining({
              id: orderGroup.id,
              payment_id: captured.data.payment.id,
              reference: "INV-1",
            })
          )
        } finally {
          await receiver.close()
        }
      })

      it("captures the group payment only once", async () => {
        const { orderGroup } = await checkout("MIR$000013")

        const first = await captureGroup(orderGroup.id)
        expect(first.status).toEqual(200)

        const second = await captureGroup(orderGroup.id)
        expect(second.status).toEqual(200)
        expect(second.data.payment.id).toEqual(first.data.payment.id)
        expect(second.data.payment.captured_at).toEqual(first.data.payment.captured_at)

        for (const order of orderGroup.orders) {
          await waitForSplitCapture(order.id)
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))

        for (const order of orderGroup.orders) {
          const data = await getOrder(
            order.id,
            "id,payment_status,*payment_collections,*payment_collections.payments,*payment_collections.payments.captures"
          )
          expect(data.payment_status).toEqual("captured")
          const payments = data.payment_collections.flatMap((pc: any) => pc.payments)
          expect(payments).toHaveLength(1)
          expect(payments[0].captures).toHaveLength(1)
        }
      })

      it("refuses an external refund before the group payment is captured", async () => {
        const { orderGroup } = await checkout("MIR$000014")

        const res = await api
          .post(
            `/admin/magento/orders/${orderGroup.orders[0].id}/refunds/external`,
            { amount: 100 },
            adminHeaders
          )
          .catch((e: any) => e.response)
        expect(res.status).toEqual(400)
        expect(res.data.message).toMatch(/not yet captured/)
      })

      it("cancels the child orders and voids the authorization when the storefront cancels before capture", async () => {
        const { orderGroup } = await checkout("MIR$000015")

        const res = await cancelGroup(orderGroup.id, { reference: "CANCEL-1" })
        expect(res.status).toEqual(200)
        expect(res.data.payment.captured_at).toBeNull()
        expect(res.data.payment.canceled_at).toBeTruthy()

        for (const order of orderGroup.orders) {
          const data = await getOrder(order.id, "id,status,payment_status")
          expect(data.status).toEqual("canceled")
          expect(data.payment_status).toEqual("canceled")
        }

        const capture = await captureGroup(orderGroup.id).catch((e: any) => e.response)
        expect(capture.status).toEqual(400)
      })

      it("refuses to cancel a captured group payment", async () => {
        const { orderGroup } = await checkout("MIR$000016")
        await captureGroup(orderGroup.id)

        const res = await cancelGroup(orderGroup.id).catch((e: any) => e.response)
        expect(res.status).toEqual(400)
        expect(res.data.message).toMatch(/already captured/)
      })

      it("still accepts a session that reports captured_at up front", async () => {
        const { orderGroup } = await checkout("MIR$000017", true)

        for (const order of orderGroup.orders) {
          await waitForSplitCapture(order.id)
          const data = await getOrder(
            order.id,
            "id,payment_status,*payment_collections,*payment_collections.payments"
          )
          const payments = data.payment_collections.flatMap((pc: any) => pc.payments)
          expect(payments[0].captured_at).toBeTruthy()
        }
      })

      it("records an external refund on the child order and emits order.refund_recorded", async () => {
        const receiver: WebhookReceiver = await startWebhookReceiver()
        try {
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["order.refund_recorded"] },
            adminHeaders
          )

          const { orderGroup } = await checkout("MIR$000003")
          const order = orderGroup.orders[0]

          await captureGroup(orderGroup.id)
          await waitForSplitCapture(order.id)

          const refund = await api.post(
            `/admin/magento/orders/${order.id}/refunds/external`,
            { amount: 500, reference: "CM-1", note: "Damaged" },
            adminHeaders
          )
          expect(refund.status).toEqual(200)
          expect(refund.data.payment.refunds).toHaveLength(1)
          expect(refund.data.payment.refunds[0].amount).toEqual(500)

          await waitFor(() => receiver.received.length > 0)
          const body = JSON.parse(receiver.received[0].body)
          expect(body.event).toEqual("order.refund_recorded")
          expect(body.data).toEqual(
            expect.objectContaining({ id: order.id, amount: 500, reference: "CM-1" })
          )
        } finally {
          await receiver.close()
        }
      })

      it("announces a refund started in Mercur as order.refund_requested, but not one recorded from Magento", async () => {
        const receiver: WebhookReceiver = await startWebhookReceiver()
        try {
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["order.refund_requested"] },
            adminHeaders
          )

          const { orderGroup } = await checkout("MIR$000004")
          const order = orderGroup.orders[0]

          await captureGroup(orderGroup.id)
          await waitForSplitCapture(order.id)

          await api.post(
            `/admin/magento/orders/${order.id}/refunds/external`,
            { amount: 300, reference: "CM-2" },
            adminHeaders
          )

          const { data } = await api.get(
            `/admin/orders/${order.id}?fields=id,*payment_collections,*payment_collections.payments`,
            adminHeaders
          )
          const payment = data.order.payment_collections
            .flatMap((pc: any) => pc.payments)
            .find((p: any) => p.provider_id === "pp_external_external")

          const sellerHeaders = order.seller?.id === seedB.sellerId ? seedB.headers : seedA.headers
          const refund = await api.post(
            `/vendor/payments/${payment.id}/refund`,
            { amount: 200, note: "Missing part" },
            sellerHeaders
          )
          expect(refund.status).toEqual(200)

          await waitFor(() => receiver.received.length > 0)
          await new Promise((resolve) => setTimeout(resolve, 1500))

          expect(receiver.received).toHaveLength(1)
          const body = JSON.parse(receiver.received[0].body)
          expect(body.event).toEqual("order.refund_requested")
          expect(body.data).toEqual(
            expect.objectContaining({
              order_id: order.id,
              payment_id: payment.id,
              amount: 200,
              note: "Missing part",
            })
          )
          expect(body.data.refund_id).toMatch(/^ref/)
        } finally {
          await receiver.close()
        }
      })

      it("adds the order id to shipment.created and delivery.created deliveries", async () => {
        const receiver: WebhookReceiver = await startWebhookReceiver()
        try {
          await api.post(
            `/admin/magento/webhooks`,
            { url: receiver.url, events: ["shipment.created", "delivery.created"] },
            adminHeaders
          )

          const { orderGroup } = await checkout("MIR$000005")
          const order = orderGroup.orders[0]
          const seed = order.seller?.id === seedB.sellerId ? seedB : seedA

          const { data } = await api.get(`/vendor/orders/${order.id}?fields=*items`, seed.headers)
          const items = data.order.items.map((item: any) => ({ id: item.id, quantity: item.quantity }))

          const fulfillment = (
            await api.post(
              `/vendor/orders/${order.id}/fulfillments`,
              { items, requires_shipping: true, location_id: seed.stockLocationId },
              seed.headers
            )
          ).data.fulfillment
          await api.post(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/shipments`,
            { items },
            seed.headers
          )
          await api.post(
            `/vendor/orders/${order.id}/fulfillments/${fulfillment.id}/mark-as-delivered`,
            {},
            seed.headers
          )

          await waitFor(() => receiver.received.length >= 2)
          const bodies = receiver.received.map((r) => JSON.parse(r.body))
          expect(bodies.map((b) => b.event).sort()).toEqual(["delivery.created", "shipment.created"])
          for (const body of bodies) {
            expect(body.data).toEqual(
              expect.objectContaining({ order_id: order.id, fulfillment_id: fulfillment.id })
            )
          }
        } finally {
          await receiver.close()
        }
      })

      it("refuses an external refund on an order without an external payment", async () => {
        const res = await api
          .post(
            `/admin/magento/orders/order_does_not_exist/refunds/external`,
            { amount: 100 },
            adminHeaders
          )
          .catch((e: any) => e.response)
        expect([400, 404]).toContain(res.status)
      })
    })
  },
})
