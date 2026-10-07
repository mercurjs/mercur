import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { MercurModules } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Offer Conditions", () => {
            let appContainer: MedusaContainer
            let headers: any
            let activeCondition: any
            let inactiveCondition: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "conditions-seller@test.com",
                    name: "Conditions Seller",
                })
                headers = result.headers

                const service = appContainer.resolve(MercurModules.OFFER)
                ;[activeCondition, inactiveCondition] =
                    await service.createOfferConditions([
                        { code: "used_like_new", label: "Used - Like New", rank: 1 },
                        {
                            code: "retired",
                            label: "Retired",
                            rank: 2,
                            is_active: false,
                        },
                    ])
            })

            const seedOfferDeps = async () => {
                const tag = `${Date.now()}${Math.floor(Math.random() * 1000)}`
                const product = await createVendorProduct(api, headers, {
                    title: `Product ${tag}`,
                    variants: [{ title: "Default" }],
                })
                const profile = await createShippingProfile(appContainer, {
                    name: `Profile ${tag}`,
                })
                return {
                    sku: `SKU-${tag}`,
                    variant_id: product.variants[0].id,
                    shipping_profile_id: profile.id,
                    inventory_items: [{ required_quantity: 1 }],
                    prices: [{ amount: 1500, currency_code: "usd" }],
                }
            }

            it("lists only active conditions", async () => {
                const response = await api.get("/vendor/offer-conditions", headers)

                expect(response.status).toEqual(200)
                const codes = response.data.offer_conditions.map((c: any) => c.code)
                expect(codes).toContain("used_like_new")
                expect(codes).not.toContain("retired")
                expect(response.data.offer_conditions[0]).not.toHaveProperty(
                    "is_active"
                )
            })

            it("retrieves an active condition and hides an inactive one", async () => {
                const active = await api.get(
                    `/vendor/offer-conditions/${activeCondition.id}`,
                    headers
                )
                expect(active.status).toEqual(200)
                expect(active.data.offer_condition.code).toEqual("used_like_new")

                const inactive = await api
                    .get(`/vendor/offer-conditions/${inactiveCondition.id}`, headers)
                    .catch((e: any) => e.response)
                expect(inactive.status).toEqual(404)
            })

            it("creates an offer under an active condition and exposes it on the offer", async () => {
                const deps = await seedOfferDeps()

                const response = await api.post(
                    "/vendor/offers",
                    { ...deps, condition_id: activeCondition.id },
                    headers
                )

                expect(response.status).toEqual(201)
                expect(response.data.offer).toEqual(
                    expect.objectContaining({
                        condition_id: activeCondition.id,
                        condition: expect.objectContaining({
                            id: activeCondition.id,
                            code: "used_like_new",
                            label: "Used - Like New",
                        }),
                    })
                )

                const listed = await api.get(
                    `/vendor/offers?condition_id=${activeCondition.id}`,
                    headers
                )
                expect(listed.data.offers.map((o: any) => o.id)).toEqual([
                    response.data.offer.id,
                ])
            })

            it("rejects an inactive or unknown condition on create", async () => {
                const deps = await seedOfferDeps()

                const inactive = await api
                    .post(
                        "/vendor/offers",
                        { ...deps, condition_id: inactiveCondition.id },
                        headers
                    )
                    .catch((e: any) => e.response)
                expect(inactive.status).toEqual(400)
                expect(inactive.data.message).toContain("not active")

                const unknown = await api
                    .post(
                        "/vendor/offers",
                        { ...deps, condition_id: "ofcond_does_not_exist" },
                        headers
                    )
                    .catch((e: any) => e.response)
                expect(unknown.status).toEqual(404)
            })

            it("updates and clears the condition on an existing offer", async () => {
                const deps = await seedOfferDeps()
                const created = await api.post("/vendor/offers", deps, headers)
                expect(created.data.offer.condition_id).toBeNull()

                const assigned = await api.post(
                    `/vendor/offers/${created.data.offer.id}`,
                    { condition_id: activeCondition.id },
                    headers
                )
                expect(assigned.status).toEqual(200)
                expect(assigned.data.offer.condition_id).toEqual(activeCondition.id)

                const rejected = await api
                    .post(
                        `/vendor/offers/${created.data.offer.id}`,
                        { condition_id: inactiveCondition.id },
                        headers
                    )
                    .catch((e: any) => e.response)
                expect(rejected.status).toEqual(400)

                const cleared = await api.post(
                    `/vendor/offers/${created.data.offer.id}`,
                    { condition_id: null },
                    headers
                )
                expect(cleared.status).toEqual(200)
                expect(cleared.data.offer.condition_id).toBeNull()
            })
        })
    },
})
