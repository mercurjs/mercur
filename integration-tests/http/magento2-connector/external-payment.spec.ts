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

      const checkout = (reference = "MIR$000001") =>
        completeExternalCheckout({
          container: appContainer,
          api,
          storeHeaders,
          regionId: region.id,
          salesChannelId: salesChannel.id,
          offerIds: [seedA.offer.id, seedB.offer.id],
          email: customerEmail,
          reference,
        })

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

      it("records the external capture so each child order is paid and commission lines exist", async () => {
        const { orderGroup } = await checkout("MIR$000002")

        for (const order of orderGroup.orders) {
          await waitFor(async () => {
            const { data } = await api.get(
              `/admin/orders/${order.id}?fields=id,payment_status,*payment_collections,*payment_collections.payments`,
              adminHeaders
            )
            return data.order.payment_status === "captured"
          })

          const { data } = await api.get(
            `/admin/orders/${order.id}?fields=id,payment_status,total,*payment_collections,*payment_collections.payments`,
            adminHeaders
          )
          const payments = data.order.payment_collections.flatMap((pc: any) => pc.payments)
          expect(payments.length).toBeGreaterThan(0)
          expect(payments[0].provider_id).toEqual("pp_external_external")
          expect(payments[0].captured_at).toBeTruthy()
          expect(payments[0].data).toEqual(
            expect.objectContaining({ reference: "MIR$000002", channel: "magento" })
          )

          const lines = await api.get(`/admin/orders/${order.id}/commission-lines`, adminHeaders)
          expect(lines.status).toEqual(200)
          expect(Array.isArray(lines.data.commission_lines)).toBe(true)
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

          await waitFor(async () => {
            const { data } = await api.get(
              `/admin/orders/${order.id}?fields=id,payment_status`,
              adminHeaders
            )
            return data.order.payment_status === "captured"
          })

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
