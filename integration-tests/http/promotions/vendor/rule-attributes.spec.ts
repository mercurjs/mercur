import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Promotion rule attribute options", () => {
      let appContainer: MedusaContainer
      let headers: any

      beforeAll(async () => {
        appContainer = getContainer()
        const seller = await createSellerUser(appContainer, {
          email: "rule-attrs-seller@test.com",
          name: "Rule Attrs Seller",
        })
        headers = seller.headers
      })

      const idsOf = (attributes: any[]) => attributes.map((a) => a.id)

      it("exposes the general rule attributes", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/rules?promotion_type=standard&application_method_type=percentage`,
          headers
        )

        expect(response.status).toEqual(200)
        const ids = idsOf(response.data.attributes)
        expect(ids).toEqual(
          expect.arrayContaining([
            "customer_group",
            "region",
            "country",
            "sales_channel",
            "currency_code",
          ])
        )
      })

      it("marks currency_code required for fixed and optional for percentage", async () => {
        const fixed = await api.get(
          `/vendor/promotions/rule-attribute-options/rules?promotion_type=standard&application_method_type=fixed`,
          headers
        )
        const percentage = await api.get(
          `/vendor/promotions/rule-attribute-options/rules?promotion_type=standard&application_method_type=percentage`,
          headers
        )

        const fixedCurrency = fixed.data.attributes.find(
          (a: any) => a.id === "currency_code"
        )
        const pctCurrency = percentage.data.attributes.find(
          (a: any) => a.id === "currency_code"
        )

        expect(fixedCurrency.required).toBe(true)
        expect(fixedCurrency.disguised).toBe(true)
        expect(pctCurrency.required).toBe(false)
      })

      it("exposes item target-rule attributes with the in/eq/ne operators", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/target-rules?promotion_type=standard&application_method_target_type=items`,
          headers
        )

        expect(response.status).toEqual(200)
        const attributes = response.data.attributes
        const ids = idsOf(attributes)
        expect(ids).toEqual(
          expect.arrayContaining([
            "offer",
            "product_category",
            "product_collection",
            "product_type",
            "product_tag",
          ])
        )

        const offer = attributes.find((a: any) => a.id === "offer")
        expect(offer.value).toEqual("items.metadata.offer_id")
        const operatorIds = offer.operators.map((o: any) => o.id)
        expect(operatorIds).toEqual(
          expect.arrayContaining(["in", "eq", "ne"])
        )
      })

      it("maps each item attribute to its query path", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/target-rules?promotion_type=standard&application_method_target_type=items`,
          headers
        )
        const byId = Object.fromEntries(
          response.data.attributes.map((a: any) => [a.id, a.value])
        )
        expect(byId.product_category).toEqual("items.product.categories.id")
        expect(byId.product_collection).toEqual("items.product.collection_id")
        expect(byId.product_type).toEqual("items.product.type_id")
        expect(byId.product_tag).toEqual("items.product.tags.id")
      })

      it("swaps to shipping option type attributes for shipping_methods target", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/target-rules?promotion_type=standard&application_method_target_type=shipping_methods`,
          headers
        )

        expect(response.status).toEqual(200)
        const ids = idsOf(response.data.attributes)
        expect(ids).toContain("shipping_option_type")
        expect(ids).not.toContain("offer")

        const attr = response.data.attributes.find(
          (a: any) => a.id === "shipping_option_type"
        )
        expect(attr.value).toEqual(
          "shipping_methods.shipping_option.shipping_option_type_id"
        )
      })

      it("adds the buyget disguised quantity rules for buyget promotions", async () => {
        const buyRules = await api.get(
          `/vendor/promotions/rule-attribute-options/buy-rules?promotion_type=buyget&application_method_target_type=items`,
          headers
        )
        const targetRules = await api.get(
          `/vendor/promotions/rule-attribute-options/target-rules?promotion_type=buyget&application_method_target_type=items`,
          headers
        )

        const buyIds = idsOf(buyRules.data.attributes)
        expect(buyIds).toContain("offer")
        expect(buyIds).toContain("buy_rules_min_quantity")

        const minQty = buyRules.data.attributes.find(
          (a: any) => a.id === "buy_rules_min_quantity"
        )
        expect(minQty.disguised).toBe(true)
        expect(minQty.field_type).toEqual("number")

        const targetIds = idsOf(targetRules.data.attributes)
        expect(targetIds).toContain("apply_to_quantity")
      })

      it("does not expose buyget quantity rules for standard promotions", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-attribute-options/buy-rules?promotion_type=standard&application_method_target_type=items`,
          headers
        )
        const ids = idsOf(response.data.attributes)
        expect(ids).not.toContain("buy_rules_min_quantity")
      })

      it("rejects an unknown rule type", async () => {
        const error = await api
          .get(
            `/vendor/promotions/rule-attribute-options/not-a-rule-type?promotion_type=standard`,
            headers
          )
          .catch((e) => e)

        expect(error.response.status).toEqual(400)
      })

      it("returns seller-scoped product category value options", async () => {
        const response = await api.get(
          `/vendor/promotions/rule-value-options/target-rules/product_category?limit=10&offset=0&application_method_target_type=items`,
          headers
        )

        expect(response.status).toEqual(200)
        expect(Array.isArray(response.data.values)).toBe(true)
      })
    })
  },
})
