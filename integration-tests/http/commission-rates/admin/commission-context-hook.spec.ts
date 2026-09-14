import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { CommissionCalculationContext, MercurModules } from "@mercurjs/types"
import { refreshOrderCommissionLinesWorkflow } from "@mercurjs/core/workflows"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("refreshOrderCommissionLinesWorkflow - setCommissionContext hook", () => {
      let appContainer: MedusaContainer
      let commissionService: any
      let orderService: any
      let productService: any

      beforeAll(async () => {
        appContainer = getContainer()
        commissionService = appContainer.resolve(MercurModules.COMMISSION)
        orderService = appContainer.resolve(Modules.ORDER)
        productService = appContainer.resolve(Modules.PRODUCT)

        refreshOrderCommissionLinesWorkflow.hooks.setCommissionContext(
          ({ contexts }) =>
            new StepResponse(
              contexts.map((context) => ({
                ...context,
                additional_context: { marker: `hooked:${context.order_id}` },
              }))
            )
        )
      })

      it("forwards additional_context, order_id and item totals to the provider", async () => {
        const [product] = await productService.createProducts([
          {
            title: "Hooked product",
            variants: [{ title: "Default", prices: [] }],
          },
        ])

        const order = await orderService.createOrders({
          currency_code: "usd",
          email: "buyer@test.com",
          items: [
            {
              title: "Hooked item",
              quantity: 2,
              unit_price: 100,
              product_id: product.id,
              variant_id: product.variants[0].id,
            },
          ],
          shipping_methods: [{ name: "Standard", amount: 50 }],
        })

        const spy = jest.spyOn(commissionService, "getCommissionLines")

        await refreshOrderCommissionLinesWorkflow(appContainer).run({
          input: { order_ids: [order.id] },
        })

        expect(spy).toHaveBeenCalledTimes(1)
        const [context] = spy.mock.calls[0] as [CommissionCalculationContext]

        expect(context.order_id).toEqual(order.id)
        expect(context.additional_context).toEqual({
          marker: `hooked:${order.id}`,
        })
        expect(context.items).toHaveLength(1)
        expect(context.items![0]).toEqual(
          expect.objectContaining({
            id: order.items![0].id,
            subtotal: 200,
            total: 200,
            product: expect.objectContaining({
              id: product.id,
              attribute_value_ids: [],
            }),
          })
        )

        const lines = await commissionService.listCommissionLines({
          item_id: order.items![0].id,
        })
        expect(lines).toHaveLength(1)
        expect(lines[0].provider_id).toEqual("system")

        spy.mockRestore()
      })
    })
  },
})
