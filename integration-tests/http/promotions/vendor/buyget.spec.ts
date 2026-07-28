import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Buyget promotions", () => {
      let appContainer: MedusaContainer
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
        const seller = await createSellerUser(appContainer, {
          email: "buyget-seller@test.com",
          name: "Buyget Seller",
        })
        headers = seller.headers
      })

      it("creates a buyget promotion with buy and target rules", async () => {
        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "BUYGET-OK",
            type: "buyget",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              value: 100,
              max_quantity: 1,
              apply_to_quantity: 1,
              buy_rules_min_quantity: 2,
              target_rules: [
                {
                  attribute: "items.product.categories.id",
                  operator: "in",
                  values: ["pcat_get"],
                },
              ],
              buy_rules: [
                {
                  attribute: "items.product.categories.id",
                  operator: "in",
                  values: ["pcat_buy"],
                },
              ],
            },
          },
          headers
        )

        expect(response.status).toEqual(200)
        expect(response.data.promotion.type).toEqual("buyget")
        const appMethod = response.data.promotion.application_method
        expect(appMethod.apply_to_quantity).toEqual(1)
        expect(appMethod.buy_rules_min_quantity).toEqual(2)
        expect(appMethod.buy_rules.length).toBeGreaterThan(0)
      })

      it("rejects a buyget promotion missing buy rules", async () => {
        const error = await api
          .post(
            `/vendor/promotions`,
            {
              code: "BUYGET-NO-BUY",
              type: "buyget",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "items",
                allocation: "each",
                value: 100,
                apply_to_quantity: 1,
                buy_rules_min_quantity: 1,
                target_rules: [
                  {
                    attribute: "items.metadata.offer_id",
                    operator: "in",
                    values: ["offer_x"],
                  },
                ],
              },
            },
            headers
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
      })

      it("rejects a buyget promotion missing the quantity fields", async () => {
        const error = await api
          .post(
            `/vendor/promotions`,
            {
              code: "BUYGET-NO-QTY",
              type: "buyget",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "items",
                allocation: "each",
                value: 100,
                max_quantity: 1,
                target_rules: [
                  {
                    attribute: "items.metadata.offer_id",
                    operator: "in",
                    values: ["offer_get"],
                  },
                ],
                buy_rules: [
                  {
                    attribute: "items.metadata.offer_id",
                    operator: "in",
                    values: ["offer_buy"],
                  },
                ],
              },
            },
            headers
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
      })
    })
  },
})
