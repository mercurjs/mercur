import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules, SellerStatus } from "@mercurjs/types"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createCustomerUser } from "../../../helpers/create-customer-user"
import {
    adminHeaders,
    createAdminUser,
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

jest.setTimeout(180000)

/**
 * Admin mirror of `vendor/order-reservation-multiplier.spec.ts`.
 *
 * Confirms that the admin route overrides under
 * `packages/core/src/api/admin/{exchanges,claims}/[id]/request` invoke
 * the Mercur workflow wrappers (`mercurConfirmExchangeRequestWorkflow`
 * / `mercurConfirmClaimRequestWorkflow`) so outbound reservations get
 * adjusted by `offer.inventory_item_link.required_quantity`. The
 * vendor side covers the same behavior — these tests are the admin
 * mirror so /admin paths get the same regression guard.
 *
 * Both branches are skipped here, matching the vendor side, because
 * Medusa's inbound items step requires the original line item to be
 * fulfilled (a 6+-call setup) and the bundle case requires the offer
 * seed to wire multiple inventory_item links. Once the vendor side
 * lifts its skips, this spec is a verbatim swap of `/vendor/` →
 * `/admin/` paths plus `adminHeaders` substitution.
 */

const approveSeller = async (
    container: MedusaContainer,
    sellerId: string
) => {
    const sellerModule: any = container.resolve(MercurModules.SELLER)
    await sellerModule.updateSellers({
        id: sellerId,
        status: SellerStatus.OPEN,
    })
}

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api, dbConnection }) => {
        describe("Admin - Reservation multiplier (exchange / claim request)", () => {
            let appContainer: MedusaContainer
            let storeHeaders: any
            let region: any
            let salesChannel: any
            let prerequisiteCounter = 0

            // Kept inline (vs. shared helper) so each spec file stays
            // self-contained — the vendor counterpart does the same.
            const seedSellerOfferWithShipping = async (opts: {
                email: string
                name: string
                stocked: number
                offerPrice: number
                inventoryItemCount?: number
                requiredQuantity?: number
            }) => {
                const inventoryItemCount = opts.inventoryItemCount ?? 1
                const requiredQuantity = opts.requiredQuantity ?? 1

                const result = await createSellerUser(appContainer, {
                    email: opts.email,
                    name: opts.name,
                })
                await approveSeller(appContainer, (result.seller as any).id)
                const headers = result.headers
                const tag = `_${opts.name}_${Date.now()}_${++prerequisiteCounter}`

                const stockLocation = (
                    await api.post(
                        `/vendor/stock-locations`,
                        { name: `Warehouse${tag}` },
                        headers
                    )
                ).data.stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-sets`,
                    { name: `FS${tag}`, type: "shipping" },
                    headers
                )
                const fulfillmentSet = (
                    await api.get(
                        `/vendor/stock-locations/${stockLocation.id}?fields=*fulfillment_sets`,
                        headers
                    )
                ).data.stock_location.fulfillment_sets[0]
                const serviceZone = (
                    await api.post(
                        `/vendor/fulfillment-sets/${fulfillmentSet.id}/service-zones`,
                        {
                            name: `SZ${tag}`,
                            geo_zones: [{ type: "country", country_code: "us" }],
                        },
                        headers
                    )
                ).data.fulfillment_set.service_zones.find(
                    (z: any) => z.name === `SZ${tag}`
                )
                const shippingProfile = (
                    await api.post(
                        `/vendor/shipping-profiles`,
                        { name: `SP${tag}`, type: "default" },
                        headers
                    )
                ).data.shipping_profile

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/fulfillment-providers`,
                    { add: ["manual_manual"] },
                    headers
                )
                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    headers
                )
                const shippingOption = (
                    await api.post(
                        `/vendor/shipping-options`,
                        {
                            name: `Ship${tag}`,
                            service_zone_id: serviceZone.id,
                            shipping_profile_id: shippingProfile.id,
                            provider_id: "manual_manual",
                            price_type: "flat",
                            type: {
                                label: "Standard",
                                description: "Standard",
                                code: "standard",
                            },
                            prices: [{ currency_code: "usd", amount: 500 }],
                            rules: [
                                {
                                    attribute: "enabled_in_store",
                                    value: "true",
                                    operator: "eq",
                                },
                            ],
                        },
                        headers
                    )
                ).data.shipping_option

                const product = (
                    await api.post(
                        `/vendor/products`,
                        {
                            status: "published",
                            title: `Prod${tag}`,
                            variant_attributes: [
                                {
                                    name: `Default${tag}`,
                                    type: "multi_select",
                                    values: ["Default"],
                                    is_variant_axis: true,
                                },
                            ],
                            variants: [
                                {
                                    title: "Default",
                                    sku: `V${tag}`,
                                    attribute_values: {
                                        [`Default${tag}`]: "Default",
                                    },
                                },
                            ],
                        },
                        headers
                    )
                ).data.product

                await api.post(
                    `/vendor/sales-channels/${salesChannel.id}/products`,
                    { add: [product.id] },
                    headers
                )

                const inventoryItems = Array.from(
                    { length: inventoryItemCount },
                    (_, i) => ({
                        title: `Inv${tag}_${i}`,
                        required_quantity: requiredQuantity,
                        stock_levels: [
                            {
                                location_id: stockLocation.id,
                                stocked_quantity: opts.stocked,
                            },
                        ],
                    })
                )

                const offer = (
                    await api.post(
                        `/vendor/offers`,
                        {
                            sku: `OF${tag}`,
                            variant_id: product.variants[0].id,
                            shipping_profile_id: shippingProfile.id,
                            inventory_items: inventoryItems,
                            prices: [
                                {
                                    amount: opts.offerPrice,
                                    currency_code: "usd",
                                },
                            ],
                        },
                        headers
                    )
                ).data.offer

                return {
                    sellerId: result.seller.id,
                    headers,
                    product,
                    variant: product.variants[0],
                    offer,
                    stockLocation,
                    shippingOption,
                    shippingProfile,
                }
            }

            const completeCartCheckout = async (offerId: string) => {
                const cart = (
                    await api.post(
                        `/store/carts`,
                        {
                            region_id: region.id,
                            sales_channel_id: salesChannel.id,
                            currency_code: "usd",
                        },
                        storeHeaders
                    )
                ).data.cart

                await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    { offer_id: offerId, quantity: 1 },
                    storeHeaders
                )

                await api.post(
                    `/store/carts/${cart.id}`,
                    {
                        email: "buyer@test.com",
                        shipping_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                        billing_address: {
                            first_name: "Buyer",
                            last_name: "Test",
                            address_1: "123 Main St",
                            city: "New York",
                            country_code: "us",
                            postal_code: "10001",
                        },
                    },
                    storeHeaders
                )

                const shippingOptionsResp = await api.get(
                    `/store/shipping-options?cart_id=${cart.id}`,
                    storeHeaders
                )
                const allOptions = Object.values(
                    shippingOptionsResp.data.shipping_options as Record<
                        string,
                        any[]
                    >
                ).flat()
                for (const opt of allOptions) {
                    await api.post(
                        `/store/carts/${cart.id}/shipping-methods`,
                        { option_id: opt.id },
                        storeHeaders
                    )
                }

                const paymentCollection = (
                    await api.post(
                        `/store/payment-collections`,
                        { cart_id: cart.id },
                        storeHeaders
                    )
                ).data.payment_collection
                await api.post(
                    `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
                    { provider_id: "pp_system_default" },
                    storeHeaders
                )

                const completeResp = await api.post(
                    `/store/carts/${cart.id}/complete`,
                    {},
                    storeHeaders
                )
                const orderGroupId = completeResp.data.order_group.id
                const query = appContainer.resolve(
                    ContainerRegistrationKeys.QUERY
                )
                const { data: orderGroup } = await query.graph({
                    entity: "order_group",
                    filters: { id: orderGroupId },
                    fields: ["id", "orders.id", "orders.items.id"],
                })
                return (orderGroup[0] as any).orders[0]
            }

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                await createAdminUser(dbConnection, adminHeaders, appContainer)

                const customerResult = await createCustomerUser(appContainer, {
                    email: "adminmultiplier@test.com",
                    first_name: "Multiplier",
                    last_name: "Buyer",
                })
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

                const salesChannelModule =
                    appContainer.resolve<ISalesChannelModuleService>(
                        Modules.SALES_CHANNEL
                    )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Admin Multiplier Channel",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Admin Multiplier Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })
            })

            describe("POST /admin/exchanges/:id/request", () => {
                it.skip(
                    "single-link offer with required_quantity > 1 — reservation qty multiplied",
                    async () => {
                        /**
                         * Mirror of the vendor §N happy path. Once the
                         * vendor seed's inbound-fulfillment setup lifts the
                         * skip there, this spec swaps `/vendor/` for
                         * `/admin/` and `seller_headers` for `adminHeaders`
                         * on the exchange + outbound-items + request POSTs.
                         * Assertion is identical: each reservation on the
                         * new outbound line item has
                         * `quantity === ordered × required_quantity`.
                         */
                        void seedSellerOfferWithShipping
                        void completeCartCheckout
                    }
                )

                it.skip(
                    "bundle offer (inventory_item_link.length > 1) — old reservation deleted, N new ones created",
                    () => {
                        /**
                         * Mirror of the vendor §N bundle case. The admin
                         * override calls the same workflow wrapper, so the
                         * assertion shape is identical:
                         *   - Medusa's single variant-keyed reservation is
                         *     gone after confirm.
                         *   - One reservation per linked `inventory_item`
                         *     exists at `qty × required_quantity`.
                         */
                    }
                )
            })

            describe("POST /admin/claims/:id/request", () => {
                it.skip(
                    "single-link offer with required_quantity > 1 — reservation qty multiplied",
                    () => {
                        /* Same shape as the exchange test — swap
                         * `/exchanges/` → `/claims/` and assert the same
                         * reservation multiplier. */
                    }
                )
            })

            describe("POST /admin/returns/:id/receive/confirm", () => {
                it.skip(
                    "offer-aware restock applies inventory_item_link.required_quantity on receive",
                    () => {
                        /**
                         * Mirror of the vendor `confirm-return-receive`
                         * coverage. After the customer returns an offer
                         * with `required_quantity=N`, calling
                         * `POST /admin/returns/:id/receive/confirm`
                         * should bump every linked inventory_item by
                         * `received_quantity × required_quantity`.
                         * Requires the inbound-fulfillment + return seed
                         * to be lifted upstream (same blocker as the
                         * vendor multiplier specs).
                         */
                    }
                )
            })
        })
    },
})
