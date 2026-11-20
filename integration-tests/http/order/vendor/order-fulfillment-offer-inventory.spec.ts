import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IInventoryService,
    IRegionModuleService,
    ISalesChannelModuleService,
    IStockLocationService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import {
    completeSplitOrderCheckout,
    seedSellerOfferWithShipping,
} from "../../../helpers/split-order-checkout"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - create fulfillment uses the offer inventory item (MER-295)", () => {
            let appContainer: MedusaContainer
            let inventoryService: IInventoryService
            let sellerSeed: Awaited<ReturnType<typeof seedSellerOfferWithShipping>>
            let storeHeaders: { headers: Record<string, string> }
            let customerEmail: string
            let region: { id: string }
            let salesChannel: { id: string }

            beforeAll(async () => {
                appContainer = getContainer()
                inventoryService = appContainer.resolve(Modules.INVENTORY)
            })

            beforeEach(async () => {
                const customerResult = await createCustomerUser(appContainer, {
                    email: "offerinventorybuyer@test.com",
                    first_name: "Offer",
                    last_name: "Buyer",
                })
                customerEmail = customerResult.customer.email!
                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customerResult.headers.headers,
                    },
                }

                salesChannel = await appContainer
                    .resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
                    .createSalesChannels({ name: "Offer Inventory Channel" })

                region = await appContainer
                    .resolve<IRegionModuleService>(Modules.REGION)
                    .createRegions({
                        name: "Offer Inventory Region",
                        currency_code: "usd",
                        countries: ["us"],
                    })

                await appContainer.resolve(ContainerRegistrationKeys.LINK).create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: { payment_provider_id: "pp_system_default" },
                })

                sellerSeed = await seedSellerOfferWithShipping({
                    container: appContainer,
                    api,
                    salesChannelId: salesChannel.id,
                    email: "offer-inventory@test.com",
                    name: "OfferInventory",
                    stocked: 10,
                    offerPrice: 1000,
                })
            })

            const placeOrder = async () => {
                const order = await completeSplitOrderCheckout({
                    container: appContainer,
                    api,
                    storeHeaders,
                    regionId: region.id,
                    salesChannelId: salesChannel.id,
                    offerId: sellerSeed.offer.id,
                    email: customerEmail,
                })

                const items: { id: string; quantity: number }[] = (
                    await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        sellerSeed.headers
                    )
                ).data.order.items

                const [reservation] = await inventoryService.listReservationItems({
                    line_item_id: items[0].id,
                })

                return {
                    order,
                    lineItem: items[0],
                    offerInventoryItemId: reservation.inventory_item_id,
                }
            }

            const stockedAt = async (inventoryItemId: string, locationId: string) => {
                const [level] = await inventoryService.listInventoryLevels({
                    inventory_item_id: inventoryItemId,
                    location_id: locationId,
                })
                return Number(level.stocked_quantity)
            }

            it("decrements the offer inventory item when the reservation sits on it", async () => {
                const { order, lineItem, offerInventoryItemId } = await placeOrder()

                const response = await api.post(
                    `/vendor/orders/${order.id}/fulfillments`,
                    {
                        items: [{ id: lineItem.id, quantity: lineItem.quantity }],
                        requires_shipping: true,
                        location_id: sellerSeed.stockLocationId,
                    },
                    sellerSeed.headers
                )

                expect(response.status).toEqual(200)
                expect(response.data.fulfillment.items).toEqual([
                    expect.objectContaining({
                        line_item_id: lineItem.id,
                        inventory_item_id: offerInventoryItemId,
                    }),
                ])
                expect(
                    await stockedAt(offerInventoryItemId, sellerSeed.stockLocationId)
                ).toEqual(9)
                expect(
                    await inventoryService.listReservationItems({
                        line_item_id: lineItem.id,
                    })
                ).toEqual([])
            })

            it("fulfills from the offer inventory item when the reservation points at another inventory item", async () => {
                const { order, lineItem, offerInventoryItemId } = await placeOrder()

                // An order placed before the offer received its own inventory
                // item is still reserved against the variant's item, which has
                // no level at the location the vendor fulfills from.
                const otherLocation = await appContainer
                    .resolve<IStockLocationService>(Modules.STOCK_LOCATION)
                    .createStockLocations({ name: "Legacy Warehouse" })
                const [staleInventoryItem] = await inventoryService.createInventoryItems([
                    { sku: `legacy-${Date.now()}` },
                ])
                await inventoryService.createInventoryLevels([
                    {
                        inventory_item_id: staleInventoryItem.id,
                        location_id: otherLocation.id,
                        stocked_quantity: 5,
                    },
                ])

                const existing = await inventoryService.listReservationItems({
                    line_item_id: lineItem.id,
                })
                await inventoryService.deleteReservationItems(
                    existing.map((reservation) => reservation.id)
                )
                await inventoryService.createReservationItems([
                    {
                        inventory_item_id: staleInventoryItem.id,
                        location_id: otherLocation.id,
                        line_item_id: lineItem.id,
                        quantity: lineItem.quantity,
                    },
                ])

                const response = await api.post(
                    `/vendor/orders/${order.id}/fulfillments`,
                    {
                        items: [{ id: lineItem.id, quantity: lineItem.quantity }],
                        requires_shipping: true,
                        location_id: sellerSeed.stockLocationId,
                    },
                    sellerSeed.headers
                )

                expect(response.status).toEqual(200)
                expect(response.data.fulfillment.items).toEqual([
                    expect.objectContaining({
                        line_item_id: lineItem.id,
                        inventory_item_id: offerInventoryItemId,
                    }),
                ])
                expect(
                    await stockedAt(offerInventoryItemId, sellerSeed.stockLocationId)
                ).toEqual(9)
                expect(
                    await stockedAt(staleInventoryItem.id, otherLocation.id)
                ).toEqual(5)
                expect(
                    await inventoryService.listReservationItems({
                        line_item_id: lineItem.id,
                    })
                ).toEqual([])
            })
        })
    },
})
