import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import {
    createOffersWorkflow,
    deleteOffersWorkflow,
    updateOffersWorkflow,
    upsertOfferPricesWorkflow,
} from "@mercurjs/core/workflows"
import { OfferDTO, OfferPriceDTO } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

jest.setTimeout(120000)

type PriceChange = {
    offer_id: string
    previous_prices: OfferPriceDTO[]
    prices: OfferPriceDTO[]
    created: string[]
    updated: string[]
    deleted: string[]
}

let createdPayload: { offers: OfferDTO[] } | null = null
let updatedPayload: {
    offers: OfferDTO[]
    previous_offers: OfferDTO[]
    updated_by: string | undefined
} | null = null
let pricesPayload: {
    offers: PriceChange[]
    updated_by: string | null
} | null = null
let deletedPayload: { ids: string[]; offers: OfferDTO[] } | null = null

createOffersWorkflow.hooks.offersCreated(({ offers }) => {
    createdPayload = { offers }
    return new StepResponse(undefined)
})

updateOffersWorkflow.hooks.offersUpdated(
    ({ offers, previous_offers, updated_by }) => {
        updatedPayload = { offers, previous_offers, updated_by }
        return new StepResponse(undefined)
    }
)

upsertOfferPricesWorkflow.hooks.offerPricesUpserted(
    ({ offers, updated_by }) => {
        pricesPayload = { offers, updated_by }
        return new StepResponse(undefined)
    }
)

deleteOffersWorkflow.hooks.offersDeleted(({ ids, offers }) => {
    deletedPayload = { ids, offers }
    return new StepResponse(undefined)
})

const byAmount = (prices: OfferPriceDTO[]) =>
    [...prices].sort((a, b) => Number(a.amount) - Number(b.amount))

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - offer change hooks", () => {
            let appContainer: MedusaContainer
            let headers: { headers: Record<string, string> }
            let memberId: string
            let variantId: string
            let shippingProfileId: string

            beforeAll(() => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                createdPayload = null
                updatedPayload = null
                pricesPayload = null
                deletedPayload = null

                const seller = await createSellerUser(appContainer, {
                    email: "hooks-seller@test.com",
                    name: "Hooks Seller",
                })
                headers = seller.headers
                memberId = seller.member.id

                const product = await createVendorProduct(api, headers, {
                    title: "Hooked Product",
                    variants: [{ title: "Default" }],
                })
                variantId = product.variants[0].id

                const profile = await createShippingProfile(appContainer, {
                    name: "Hooks Profile",
                })
                shippingProfileId = profile.id
            })

            const createOffer = async () => {
                const response = await api.post(
                    `/vendor/offers`,
                    {
                        sku: "HOOKED-SKU",
                        variant_id: variantId,
                        shipping_profile_id: shippingProfileId,
                        inventory_items: [{ required_quantity: 1 }],
                        prices: [
                            {
                                amount: 1000,
                                currency_code: "usd",
                                min_quantity: 1,
                                max_quantity: 9,
                            },
                            { amount: 800, currency_code: "usd", min_quantity: 10 },
                            { amount: 900, currency_code: "eur" },
                        ],
                    },
                    headers
                )
                expect(response.status).toEqual(201)
                return response.data.offer as OfferDTO & {
                    prices: OfferPriceDTO[]
                }
            }

            it("passes the created prices and created_by to offersCreated", async () => {
                const offer = await createOffer()

                expect(createdPayload?.offers).toHaveLength(1)
                const [created] = createdPayload!.offers
                expect(created.id).toEqual(offer.id)
                expect(created.created_by).toEqual(memberId)
                expect(byAmount(created.prices!).map((p) => p.amount)).toEqual([
                    800, 900, 1000,
                ])
                expect(created.prices!.map((p) => p.id).sort()).toEqual(
                    offer.prices.map((p) => p.id).sort()
                )
            })

            it("reports the price ladder diff, the previous row and the actor on update", async () => {
                const offer = await createOffer()
                const usdTier1 = offer.prices.find((p) => p.amount === 1000)!
                const usdTier2 = offer.prices.find((p) => p.amount === 800)!
                const eur = offer.prices.find((p) => p.amount === 900)!

                const response = await api.post(
                    `/vendor/offers/${offer.id}`,
                    {
                        sku: "HOOKED-SKU-2",
                        prices: [
                            {
                                id: usdTier1.id,
                                amount: 1200,
                                currency_code: "usd",
                                min_quantity: 1,
                                max_quantity: 9,
                            },
                            { id: eur.id, amount: 900, currency_code: "eur" },
                            { amount: 700, currency_code: "usd", min_quantity: 20 },
                        ],
                    },
                    headers
                )
                expect(response.status).toEqual(200)

                expect(pricesPayload).not.toBeNull()
                expect(pricesPayload!.updated_by).toEqual(memberId)
                expect(pricesPayload!.offers).toHaveLength(1)

                const change = pricesPayload!.offers[0]
                expect(change.offer_id).toEqual(offer.id)
                expect(byAmount(change.previous_prices)).toEqual([
                    expect.objectContaining({
                        id: usdTier2.id,
                        amount: 800,
                        currency_code: "usd",
                        min_quantity: 10,
                    }),
                    expect.objectContaining({
                        id: eur.id,
                        amount: 900,
                        currency_code: "eur",
                    }),
                    expect.objectContaining({
                        id: usdTier1.id,
                        amount: 1000,
                        currency_code: "usd",
                        min_quantity: 1,
                        max_quantity: 9,
                    }),
                ])
                expect(change.updated).toEqual([usdTier1.id])
                expect(change.deleted).toEqual([usdTier2.id])
                expect(change.created).toHaveLength(1)

                const [createdId] = change.created
                expect(byAmount(change.prices)).toEqual([
                    expect.objectContaining({
                        id: createdId,
                        amount: 700,
                        currency_code: "usd",
                        min_quantity: 20,
                    }),
                    expect.objectContaining({ id: eur.id, amount: 900 }),
                    expect.objectContaining({ id: usdTier1.id, amount: 1200 }),
                ])
                expect(
                    change.prices.find((p) => p.id === usdTier1.id)?.price_rules
                ).toEqual([
                    expect.objectContaining({
                        attribute: "offer_id",
                        value: offer.id,
                    }),
                ])

                expect(updatedPayload).not.toBeNull()
                expect(updatedPayload!.updated_by).toEqual(memberId)
                expect(updatedPayload!.previous_offers).toEqual([
                    expect.objectContaining({ id: offer.id, sku: "HOOKED-SKU" }),
                ])
                expect(updatedPayload!.offers).toEqual([
                    expect.objectContaining({ id: offer.id, sku: "HOOKED-SKU-2" }),
                ])
            })

            it("does not run the price hook when prices are not part of the update", async () => {
                const offer = await createOffer()

                const response = await api.post(
                    `/vendor/offers/${offer.id}`,
                    { sku: "HOOKED-SKU-3" },
                    headers
                )
                expect(response.status).toEqual(200)
                expect(pricesPayload).toBeNull()
                expect(updatedPayload?.updated_by).toEqual(memberId)
            })

            it("snapshots the offer with its prices before deletion", async () => {
                const offer = await createOffer()

                const response = await api.delete(
                    `/vendor/offers/${offer.id}`,
                    headers
                )
                expect(response.status).toEqual(200)

                expect(deletedPayload).not.toBeNull()
                expect(deletedPayload!.ids).toEqual([offer.id])
                expect(deletedPayload!.offers).toHaveLength(1)

                const [snapshot] = deletedPayload!.offers
                expect(snapshot).toEqual(
                    expect.objectContaining({
                        id: offer.id,
                        sku: "HOOKED-SKU",
                        seller_id: offer.seller_id,
                        created_by: memberId,
                    })
                )
                expect(byAmount(snapshot.prices!).map((p) => p.amount)).toEqual([
                    800, 900, 1000,
                ])
                expect(snapshot.prices!.map((p) => p.id).sort()).toEqual(
                    offer.prices.map((p) => p.id).sort()
                )
            })
        })
    },
})
