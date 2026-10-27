import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"
import {
  createShippingRule,
  createShippingRuleAndEnable,
} from "../../../helpers/shipping-rules"

jest.setTimeout(180000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Operator shipping rules", () => {
      let appContainer: MedusaContainer
      let sellerHeaders: { headers: Record<string, string> }
      let stockLocationId: string
      let profileId: string

      beforeEach(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const seller = await createSellerUser(appContainer, {
          email: `rules-${Date.now()}@test.com`,
          name: "Rules Seller",
        })
        sellerHeaders = seller.headers
        stockLocationId = (
          await api.post(
            "/vendor/stock-locations",
            { name: "Warehouse" },
            sellerHeaders
          )
        ).data.stock_location.id
        profileId = (
          await createShippingProfile(appContainer, {
            name: "Bulky",
            type: "custom",
          })
        ).id
      })

      describe("admin", () => {
        it("creates zones, methods and rules and lists them", async () => {
          const { zone, method, rule } = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
            countryCodes: ["us", "ca"],
            requirement: "mandatory",
            prices: [{ currency_code: "usd", amount: 1490 }],
            transitMinDays: 1,
            transitMaxDays: 3,
          })

          expect(zone.geo_zones).toHaveLength(2)
          expect(method.provider_id).toEqual("manual_manual")
          expect(rule).toEqual(
            expect.objectContaining({
              requirement: "mandatory",
              transit_min_days: 1,
              transit_max_days: 3,
              prices: [
                expect.objectContaining({ currency_code: "usd", amount: 1490 }),
              ],
            })
          )

          const list = await api.get(
            `/admin/shipping-rules?shipping_profile_id=${profileId}`,
            adminHeaders
          )
          expect(list.data.shipping_rules.map((r: { id: string }) => r.id)).toEqual([
            rule.id,
          ])
        })

        it("rejects a method whose provider does not exist", async () => {
          const optionType = (
            await api.post(
              "/admin/shipping-option-types",
              { label: "X", code: `x-${Date.now()}`, description: "" },
              adminHeaders
            )
          ).data.shipping_option_type
          const res = await api
            .post(
              "/admin/shipping-methods",
              {
                name: "Ghost",
                code: "ghost",
                provider_id: "nope_nope",
                shipping_option_type_id: optionType.id,
              },
              adminHeaders
            )
            .catch((e) => e.response)
          expect(res.status).toEqual(400)
        })

        it("replaces a rule's prices on update", async () => {
          const { rule } = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
          })
          const updated = await api.post(
            `/admin/shipping-rules/${rule.id}`,
            { prices: [{ currency_code: "eur", amount: 900 }] },
            adminHeaders
          )
          expect(updated.data.shipping_rule.prices).toEqual([
            expect.objectContaining({ currency_code: "eur", amount: 900 }),
          ])
        })

        it("pushes a zone's countries down to enabled service zones", async () => {
          const { zone, shippingOption } = await createShippingRuleAndEnable(
            api,
            {
              adminHeaders,
              sellerHeaders,
              stockLocationId,
              shippingProfileId: profileId,
            }
          )

          await api.post(
            `/admin/shipping-zones/${zone.id}`,
            {
              geo_zones: [
                { type: "country", country_code: "us" },
                { type: "country", country_code: "mx" },
              ],
            },
            adminHeaders
          )

          const option = (
            await api.get(
              `/admin/shipping-options/${shippingOption.id}?fields=+service_zone.geo_zones.*`,
              adminHeaders
            )
          ).data.shipping_option
          expect(
            option.service_zone.geo_zones
              .map((g: { country_code: string }) => g.country_code)
              .sort()
          ).toEqual(["mx", "us"])
        })
      })

      describe("vendor", () => {
        it("enables a rule with the method's provider, type and the operator's price", async () => {
          const { method, rule, shippingOption } =
            await createShippingRuleAndEnable(api, {
              adminHeaders,
              sellerHeaders,
              stockLocationId,
              shippingProfileId: profileId,
              prices: [{ currency_code: "usd", amount: 1490 }],
            })

          expect(shippingOption).toEqual(
            expect.objectContaining({
              provider_id: method.provider_id,
              shipping_profile_id: profileId,
            })
          )
          expect(shippingOption.prices).toEqual([
            expect.objectContaining({ currency_code: "usd", amount: 1490 }),
          ])

          const rules = await api.get("/vendor/shipping-rules", sellerHeaders)
          const listed = rules.data.shipping_rules.find(
            (r: { id: string }) => r.id === rule.id
          )
          expect(listed.seller_shipping_options).toEqual([
            expect.objectContaining({
              id: shippingOption.id,
              stock_location_id: stockLocationId,
            }),
          ])
        })

        it("rejects enabling the same rule twice for a location", async () => {
          const { rule } = await createShippingRuleAndEnable(api, {
            adminHeaders,
            sellerHeaders,
            stockLocationId,
            shippingProfileId: profileId,
          })
          const res = await api
            .post(
              `/vendor/shipping-rules/${rule.id}/enable`,
              { stock_location_id: stockLocationId },
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(res.status).toBeGreaterThanOrEqual(400)
        })

        it("rejects seller prices when the operator locks them, and accepts them when allowed", async () => {
          const locked = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
          })
          const lockedRes = await api
            .post(
              `/vendor/shipping-rules/${locked.rule.id}/enable`,
              {
                stock_location_id: stockLocationId,
                prices: [{ currency_code: "usd", amount: 1 }],
              },
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(lockedRes.status).toEqual(400)

          const open = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
            sellerCanEditPrice: true,
          })
          const openRes = await api.post(
            `/vendor/shipping-rules/${open.rule.id}/enable`,
            {
              stock_location_id: stockLocationId,
              prices: [{ currency_code: "usd", amount: 777 }],
            },
            sellerHeaders
          )
          expect(openRes.data.shipping_option.prices).toEqual([
            expect.objectContaining({ amount: 777 }),
          ])
        })

        it("does not let a seller change a locked price or the provider afterwards", async () => {
          const { shippingOption } = await createShippingRuleAndEnable(api, {
            adminHeaders,
            sellerHeaders,
            stockLocationId,
            shippingProfileId: profileId,
          })

          const priceRes = await api
            .post(
              `/vendor/shipping-options/${shippingOption.id}`,
              { prices: [{ currency_code: "usd", amount: 1 }] },
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(priceRes.status).toEqual(400)

          const providerRes = await api
            .post(
              `/vendor/shipping-options/${shippingOption.id}`,
              { provider_id: "manual_manual" },
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(providerRes.status).toEqual(400)
        })

        it("cannot enable a not supported rule", async () => {
          const { rule } = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
            requirement: "not_supported",
          })
          const res = await api
            .post(
              `/vendor/shipping-rules/${rule.id}/enable`,
              { stock_location_id: stockLocationId },
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(res.status).toEqual(400)
        })

        it("no longer lets sellers create shipping options directly", async () => {
          const res = await api
            .post("/vendor/shipping-options", { name: "Own" }, sellerHeaders)
            .catch((e) => e.response)
          expect(res.status).toEqual(400)
        })
      })

      describe("mandatory rules", () => {
        const createOffer = async (variantId: string) =>
          api
            .post(
              "/vendor/offers",
              {
                sku: `SKU-${Date.now()}`,
                variant_id: variantId,
                shipping_profile_id: profileId,
                inventory_items: [
                  {
                    stock_levels: [
                      { location_id: stockLocationId, stocked_quantity: 5 },
                    ],
                  },
                ],
                prices: [{ amount: 1000, currency_code: "usd" }],
              },
              sellerHeaders
            )
            .catch((e) => e.response)

        it("blocks offers in the profile until the seller enables the mandatory rule", async () => {
          const { rule } = await createShippingRule(api, {
            adminHeaders,
            shippingProfileId: profileId,
            requirement: "mandatory",
          })
          const product = await createVendorProduct(api, sellerHeaders, {
            title: `Sofa ${Date.now()}`,
          })

          const blocked = await createOffer(product.variants[0].id)
          expect(blocked.status).toEqual(400)

          const missing = await api.get(
            "/vendor/shipping-rules?missing_mandatory=true",
            sellerHeaders
          )
          expect(
            missing.data.shipping_rules.map((r: { id: string }) => r.id)
          ).toEqual([rule.id])

          await api.post(
            `/vendor/shipping-rules/${rule.id}/enable`,
            { stock_location_id: stockLocationId },
            sellerHeaders
          )

          const allowed = await createOffer(product.variants[0].id)
          expect(allowed.status).toEqual(201)
        })

        it("does not let a seller delete its last option for a mandatory rule", async () => {
          const { shippingOption } = await createShippingRuleAndEnable(api, {
            adminHeaders,
            sellerHeaders,
            stockLocationId,
            shippingProfileId: profileId,
            requirement: "mandatory",
          })
          const res = await api
            .delete(
              `/vendor/shipping-options/${shippingOption.id}`,
              sellerHeaders
            )
            .catch((e) => e.response)
          expect(res.status).toEqual(400)
        })

        it("lets a seller delete an option for an optional rule", async () => {
          const { shippingOption } = await createShippingRuleAndEnable(api, {
            adminHeaders,
            sellerHeaders,
            stockLocationId,
            shippingProfileId: profileId,
          })
          const res = await api.delete(
            `/vendor/shipping-options/${shippingOption.id}`,
            sellerHeaders
          )
          expect(res.status).toEqual(200)
        })
      })
    })
  },
})
