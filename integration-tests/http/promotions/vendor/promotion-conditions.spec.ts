import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Promotion conditions & rules", () => {
      let appContainer: MedusaContainer
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
        const seller = await createSellerUser(appContainer, {
          email: "promo-conditions-seller@test.com",
          name: "Promo Conditions Seller",
        })
        headers = seller.headers
      })

      it("creates a promotion targeting a product category", async () => {
        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "COND-CAT",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              value: 10,
              max_quantity: 1,
              target_rules: [
                {
                  attribute: "items.product.categories.id",
                  operator: "in",
                  values: ["pcat_test_1", "pcat_test_2"],
                },
              ],
            },
          },
          headers
        )

        expect(response.status).toEqual(200)
        const rules = response.data.promotion.application_method.target_rules
        expect(
          rules.some(
            (r: any) => r.attribute === "items.product.categories.id"
          )
        ).toBe(true)
      })

      it("creates promotions for collection, type and tag target rules", async () => {
        const cases: Array<[string, string]> = [
          ["COND-COLL", "items.product.collection_id"],
          ["COND-TYPE", "items.product.type_id"],
          ["COND-TAG", "items.product.tags.id"],
        ]

        for (const [code, attribute] of cases) {
          const response = await api.post(
            `/vendor/promotions`,
            {
              code,
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "items",
                allocation: "each",
                value: 10,
                max_quantity: 1,
                target_rules: [
                  { attribute, operator: "in", values: ["val_1"] },
                ],
              },
            },
            headers
          )

          expect(response.status).toEqual(200)
          const rules =
            response.data.promotion.application_method.target_rules
          expect(rules.some((r: any) => r.attribute === attribute)).toBe(true)
        }
      })

      it("accepts the 'ne' (not in) operator on a target rule", async () => {
        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "COND-NE",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "items",
              allocation: "each",
              value: 10,
              max_quantity: 1,
              target_rules: [
                {
                  attribute: "items.product.categories.id",
                  operator: "ne",
                  values: ["pcat_excluded"],
                },
              ],
            },
          },
          headers
        )

        expect(response.status).toEqual(200)
        const rule =
          response.data.promotion.application_method.target_rules.find(
            (r: any) => r.attribute === "items.product.categories.id"
          )
        expect(rule.operator).toEqual("ne")
      })

      it("creates a promotion gated by general rules (customer group, region, sales channel, country)", async () => {
        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "COND-GENERAL",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "order",
              allocation: "across",
              value: 10,
            },
            rules: [
              {
                attribute: "customer.groups.id",
                operator: "in",
                values: ["cusgroup_test"],
              },
              {
                attribute: "shipping_address.country_code",
                operator: "in",
                values: ["us"],
              },
            ],
          },
          headers
        )

        expect(response.status).toEqual(200)
        const rules = response.data.promotion.rules
        const attributes = rules.map((r: any) => r.attribute)
        expect(attributes).toEqual(
          expect.arrayContaining([
            "customer.groups.id",
            "shipping_address.country_code",
          ])
        )
      })

      it("creates a promotion targeting shipping methods", async () => {
        const response = await api.post(
          `/vendor/promotions`,
          {
            code: "COND-SHIPPING",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "shipping_methods",
              allocation: "each",
              value: 50,
              max_quantity: 1,
              target_rules: [
                {
                  attribute:
                    "shipping_methods.shipping_option.shipping_option_type_id",
                  operator: "in",
                  values: ["sotype_test"],
                },
              ],
            },
          },
          headers
        )

        expect(response.status).toEqual(200)
        expect(
          response.data.promotion.application_method.target_type
        ).toEqual("shipping_methods")
      })
    })
  },
})
