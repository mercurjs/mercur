import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"
import {
    adminHeaders,
    createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Offer Conditions", () => {
            let appContainer: MedusaContainer

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            const createCondition = async (
                body: Record<string, unknown>
            ) => {
                const response = await api.post(
                    "/admin/offer-conditions",
                    body,
                    adminHeaders
                )
                expect(response.status).toEqual(201)
                return response.data.offer_condition
            }

            it("creates, retrieves, updates and deletes an offer condition", async () => {
                const created = await createCondition({
                    code: "refurbished",
                    label: "Refurbished",
                    rank: 2,
                })

                expect(created).toEqual(
                    expect.objectContaining({
                        id: expect.stringMatching(/^ofcond_/),
                        code: "refurbished",
                        label: "Refurbished",
                        is_active: true,
                        rank: 2,
                    })
                )

                const retrieved = await api.get(
                    `/admin/offer-conditions/${created.id}`,
                    adminHeaders
                )
                expect(retrieved.status).toEqual(200)
                expect(retrieved.data.offer_condition.id).toEqual(created.id)

                const updated = await api.post(
                    `/admin/offer-conditions/${created.id}`,
                    { label: "Renewed", is_active: false },
                    adminHeaders
                )
                expect(updated.status).toEqual(200)
                expect(updated.data.offer_condition).toEqual(
                    expect.objectContaining({
                        code: "refurbished",
                        label: "Renewed",
                        is_active: false,
                    })
                )

                const deleted = await api.delete(
                    `/admin/offer-conditions/${created.id}`,
                    adminHeaders
                )
                expect(deleted.status).toEqual(200)
                expect(deleted.data).toEqual({
                    id: created.id,
                    object: "offer_condition",
                    deleted: true,
                })

                const missing = await api
                    .get(`/admin/offer-conditions/${created.id}`, adminHeaders)
                    .catch((e: any) => e.response)
                expect(missing.status).toEqual(404)
            })

            it("lists conditions ordered by rank and filters by is_active", async () => {
                await createCondition({ code: "used_good", label: "Used - Good", rank: 5 })
                await createCondition({
                    code: "used_like_new",
                    label: "Used - Like New",
                    rank: 1,
                })
                await createCondition({
                    code: "collectible",
                    label: "Collectible",
                    rank: 3,
                    is_active: false,
                })

                const all = await api.get("/admin/offer-conditions", adminHeaders)
                expect(all.status).toEqual(200)
                const codes = all.data.offer_conditions.map((c: any) => c.code)
                expect(codes.indexOf("used_like_new")).toBeLessThan(
                    codes.indexOf("collectible")
                )
                expect(codes.indexOf("collectible")).toBeLessThan(
                    codes.indexOf("used_good")
                )

                const active = await api.get(
                    "/admin/offer-conditions?is_active=false",
                    adminHeaders
                )
                expect(active.data.offer_conditions.map((c: any) => c.code)).toEqual([
                    "collectible",
                ])
            })

            it("rejects a duplicate code", async () => {
                await createCondition({ code: "open_box", label: "Open box" })

                const duplicate = await api
                    .post(
                        "/admin/offer-conditions",
                        { code: "open_box", label: "Open box again" },
                        adminHeaders
                    )
                    .catch((e: any) => e.response)

                expect(duplicate.status).toEqual(400)
            })

            it("refuses to delete a condition that offers are listed under", async () => {
                const condition = await createCondition({
                    code: "used_acceptable",
                    label: "Used - Acceptable",
                })

                const { headers } = await createSellerUser(appContainer, {
                    email: "condition-seller@test.com",
                    name: "Condition Seller",
                })
                const product = await createVendorProduct(api, headers, {
                    title: "Condition Product",
                    variants: [{ title: "Default" }],
                })
                const profile = await createShippingProfile(appContainer, {
                    name: "Condition Profile",
                })

                const offer = await api.post(
                    "/vendor/offers",
                    {
                        sku: "COND-SKU-1",
                        variant_id: product.variants[0].id,
                        shipping_profile_id: profile.id,
                        inventory_items: [{ required_quantity: 1 }],
                        prices: [{ amount: 1000, currency_code: "usd" }],
                        condition_id: condition.id,
                    },
                    headers
                )
                expect(offer.status).toEqual(201)

                const deleted = await api
                    .delete(`/admin/offer-conditions/${condition.id}`, adminHeaders)
                    .catch((e: any) => e.response)
                expect(deleted.status).toEqual(400)
                expect(deleted.data.message).toContain("cannot be deleted")

                const listed = await api.get(
                    `/admin/offers?condition_id=${condition.id}`,
                    adminHeaders
                )
                expect(listed.data.offers).toHaveLength(1)
                expect(listed.data.offers[0]).toEqual(
                    expect.objectContaining({
                        id: offer.data.offer.id,
                        condition_id: condition.id,
                        condition: expect.objectContaining({
                            code: "used_acceptable",
                            label: "Used - Acceptable",
                        }),
                    })
                )
            })
        })
    },
})
