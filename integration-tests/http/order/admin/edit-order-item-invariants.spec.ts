import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

type AuthHeaders = { headers: Record<string, string> }

jest.setTimeout(240000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("admin order-edit item mutation guards (T002 + T003)", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: AuthHeaders
            let storeHeaders: AuthHeaders
            let region: { id: string; currency_code: string }
            let salesChannel: { id: string }
            let stockLocation: { id: string }
            let variantA: string
            let variantB: string

            // Per-test cart/customer state — `cancel-order-invariant.spec.ts`
            // documented that storeHeaders publishable-key state goes stale
            // across tests, so customer + headers are seeded per-test.
            let customerSuffix = 0

            beforeAll(async () => {
                appContainer = getContainer()
                await createAdminUser(dbConnection, adminHeaders, appContainer)
            })

            // Per-test full setup: cancel-order-invariant.spec.ts documented
            // that storeHeaders publishable-key state goes stale across
            // tests, so seller / region / sales channel / product /
            // stock-location are seeded per-test for correctness.
            beforeEach(async () => {
                customerSuffix++

                const sellerResult = await createSellerUser(appContainer, {
                    email: `edit-invariant-seller-${customerSuffix}@test.com`,
                    name: `Edit Invariant Seller ${customerSuffix}`,
                })
                sellerHeaders = sellerResult.headers

                const customer = await createCustomerUser(appContainer, {
                    email: `edit-invariant-customer-${customerSuffix}@test.com`,
                    first_name: "Edit",
                    last_name: "Customer",
                })

                const apiKey = await generatePublishableKey(appContainer)
                const baseStoreHeaders = generateStoreHeaders({
                    publishableKey: apiKey,
                })
                storeHeaders = {
                    headers: {
                        ...baseStoreHeaders.headers,
                        ...customer.headers.headers,
                    },
                }

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL,
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: `Edit Invariant Store ${customerSuffix}`,
                })

                const regionModule =
                    appContainer.resolve<IRegionModuleService>(Modules.REGION)
                region = await regionModule.createRegions({
                    name: `Edit Invariant Region ${customerSuffix}`,
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(
                    ContainerRegistrationKeys.LINK,
                )
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                const productA = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Edit Invariant Product A ${customerSuffix}`,
                            options: [{ title: "Size", values: ["M"] }],
                            variants: [
                                {
                                    title: "Medium",
                                    sku: `EI-A-${customerSuffix}`,
                                    options: { Size: "M" },
                                    prices: [
                                        { currency_code: "usd", amount: 2000 },
                                    ],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        sellerHeaders,
                    )
                ).data.product
                variantA = productA.variants[0].id

                const productB = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Edit Invariant Product B ${customerSuffix}`,
                            options: [{ title: "Size", values: ["L"] }],
                            variants: [
                                {
                                    title: "Large",
                                    sku: `EI-B-${customerSuffix}`,
                                    options: { Size: "L" },
                                    prices: [
                                        { currency_code: "usd", amount: 1500 },
                                    ],
                                    manage_inventory: false,
                                },
                            ],
                            sales_channels: [{ id: salesChannel.id }],
                        },
                        sellerHeaders,
                    )
                ).data.product
                variantB = productB.variants[0].id

                const prereq = await setupStockLocation(sellerHeaders, "ei")
                stockLocation = prereq.stockLocation

                await api.post(
                    `/vendor/shipping-options`,
                    shippingOptionBody(prereq, "ei-out", false),
                    sellerHeaders,
                )
            })

            let prereqCounter = 0

            const setupStockLocation = async (
                headers: AuthHeaders,
                prefix: string,
            ) => {
                const suffix = `_${prefix}_${Date.now()}_${++prereqCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `EI-${prefix}-loc${suffix}` },
                        headers,
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    {
                        name: `EI-${prefix}-fs${suffix}`,
                        type: "shipping",
                    },
                    headers,
                )

                const updatedLocation = await api.get(
                    `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                    headers,
                )
                const fulfillmentSet =
                    updatedLocation.data.stock_location.fulfillment_sets[0]

                const serviceZoneResp = await api.post(
                    `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                    {
                        name: `EI-${prefix}-sz${suffix}`,
                        geo_zones: [{ type: "country", country_code: "us" }],
                    },
                    headers,
                )
                const serviceZone =
                    serviceZoneResp.data.fulfillment_set.service_zones.find(
                        (z: { name: string }) =>
                            z.name === `EI-${prefix}-sz${suffix}`,
                    )

                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        {
                            name: `EI-${prefix}-sp${suffix}`,
                            type: "default",
                        },
                        headers,
                    )
                ).data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers,
                )
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers,
                )

                return { stockLocation, serviceZone, shippingProfile, suffix }
            }

            const shippingOptionBody = (
                prereq: {
                    serviceZone: { id: string }
                    shippingProfile: { id: string }
                    suffix: string
                },
                label: string,
                isReturn: boolean,
            ) => ({
                name: `EI-${label}-${prereq.suffix}`,
                service_zone_id: prereq.serviceZone.id,
                shipping_profile_id: prereq.shippingProfile.id,
                provider_id: "manual_manual",
                price_type: "flat",
                type: {
                    label: isReturn ? "Return" : "Standard",
                    description: isReturn ? "Return" : "Standard",
                    code: isReturn ? "return" : "standard",
                },
                prices: [{ currency_code: "usd", amount: 500 }],
                rules: [
                    {
                        attribute: "enabled_in_store",
                        value: "true",
                        operator: "eq",
                    },
                    {
                        attribute: "is_return",
                        value: isReturn ? "true" : "false",
                        operator: "eq",
                    },
                ],
            })

            // Per-test fixture: order with two line items
            //   - itemA (qty=5, fulfilled=2, returned=0) → minQty=2
            //   - itemB (qty=2, plain) → minQty=0, canRemove=true
            //
            // Returned-quantity branch is exercised by the unit tests on the
            // helper. Wiring a Medusa return through to processed state
            // creates a competing orderChange that blocks the order-edit
            // session — covered separately by manual smoke + the unit-level
            // parity spec.
            const seedOrderAndOpenEdit = async () => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders,
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { variant_id: variantA, quantity: 5 },
                    storeHeaders,
                )
                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { variant_id: variantB, quantity: 2 },
                    storeHeaders,
                )

                const shippingOptions = (
                    await api.get(
                        `/store/shipping-options?cart_id=${cart.id}`,
                        storeHeaders,
                    )
                ).data.shipping_options as Record<string, any[]>
                for (const [, opts] of Object.entries(shippingOptions)) {
                    if (opts.length > 0) {
                        await api.post(
                            `/store/carts/${cart.id}/shipping-methods`,
                            { option_id: opts[0].id },
                            storeHeaders,
                        )
                    }
                }

                const paymentCollection = (
                    await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders,
                    )
                ).data.payment_collection

                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders,
                )

                const orderGroup = (
                    await api.post(
                        `/store/carts/${cart.id}/complete`,
                        {},
                        storeHeaders,
                    )
                ).data.order_group

                const order = (
                    await api.get(
                        `/store/order-groups/${orderGroup.id}?fields=*orders`,
                        storeHeaders,
                    )
                ).data.order_group.orders[0]

                const orderWithItems = (
                    await api.get(
                        `/vendor/orders/${order.id}?fields=*items`,
                        sellerHeaders,
                    )
                ).data.order
                const itemA = orderWithItems.items.find(
                    (i: any) => i.variant_id === variantA,
                )
                const itemB = orderWithItems.items.find(
                    (i: any) => i.variant_id === variantB,
                )

                // Fulfill 2 of the 5 itemA units (partial fulfillment).
                await api.post(
                    `/vendor/orders/${order.id}/fulfillments`,
                    {
                        items: [{ id: itemA.id, quantity: 2 }],
                        requires_shipping: true,
                        location_id: stockLocation.id,
                    },
                    sellerHeaders,
                )

                // Open an admin order-edit session. Medusa's
                // /admin/order-edits/:id/items/item/:item_id endpoint reads
                // :id as the ORDER id (not the order_change id) — naming is
                // misleading but the workflow resolves the active edit
                // implicitly per order.
                await api.post(
                    `/admin/order-edits`,
                    { order_id: order.id },
                    adminHeaders,
                )

                return {
                    order,
                    itemAId: itemA.id as string,
                    itemBId: itemB.id as string,
                }
            }

            describe("POST /admin/order-edits/:id/items/item/:item_id — invariant guards", () => {
                it("passes the happy path when reducing to a quantity >= fulfilled + returned", async () => {
                    const { order, itemAId } = await seedOrderAndOpenEdit()

                    // itemA: fulfilled=2, returned=0 → minQty=2.
                    const response = await api.post(
                        `/admin/order-edits/${order.id}/items/item/${itemAId}`,
                        { quantity: 2 },
                        adminHeaders,
                    )
                    expect(response.status).toEqual(200)
                })

                it("rejects reducing below fulfilled + returned with 400 + ITEM_CANNOT_REDUCE_BELOW_FULFILLED_RETURNED", async () => {
                    const { order, itemAId } = await seedOrderAndOpenEdit()

                    const response = await api
                        .post(
                            `/admin/order-edits/${order.id}/items/item/${itemAId}`,
                            { quantity: 1 },
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    expect(response.status).toEqual(400)
                    expect(response.data.code).toEqual(
                        "ITEM_CANNOT_REDUCE_BELOW_FULFILLED_RETURNED",
                    )
                })

                it("preserves edit items unchanged after a rejected reduction", async () => {
                    const { order, itemAId } = await seedOrderAndOpenEdit()

                    const before = (
                        await api.get(
                            `/admin/orders/${order.id}?fields=items.*`,
                            adminHeaders,
                        )
                    ).data.order
                    const itemABefore = before.items.find(
                        (i: any) => i.id === itemAId,
                    )
                    const quantityBefore = itemABefore.quantity

                    await api
                        .post(
                            `/admin/order-edits/${order.id}/items/item/${itemAId}`,
                            { quantity: 1 },
                            adminHeaders,
                        )
                        .catch((err) => err.response)

                    const after = (
                        await api.get(
                            `/admin/orders/${order.id}?fields=items.*`,
                            adminHeaders,
                        )
                    ).data.order
                    const itemAAfter = after.items.find(
                        (i: any) => i.id === itemAId,
                    )
                    expect(itemAAfter.quantity).toEqual(quantityBefore)
                })
            })
        })
    },
})
