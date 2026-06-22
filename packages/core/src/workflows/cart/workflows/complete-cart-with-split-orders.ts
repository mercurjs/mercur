import {
    CartWorkflowDTO,
    CreateOrderDTO,
    LinkDefinition,
    PromotionDTO,
    ShippingOptionDTO,
    UsageComputedActions,
} from "@medusajs/framework/types"
import {
    generateEntityId,
    isDefined,
    MathBN,
    Modules,
    OrderStatus,
    OrderWorkflowEvents,
} from "@medusajs/framework/utils"
import {
    createHook,
    createWorkflow,
    parallelize,
    transform,
    when,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
    acquireLockStep,
    addOrderTransactionStep,
    authorizePaymentSessionStep,
    createOrdersStep,
    createRemoteLinkStep,
    emitEventStep,
    releaseLockStep,
    reserveInventoryStep,
    updateCartsStep,
    useQueryGraphStep,
    validateCartPaymentsStep,
    validateShippingStep,
} from "@medusajs/medusa/core-flows"
import { CreateOrderGroupDTO, MercurModules, SellerDTO } from "@mercurjs/types"
import { createOrderGroupStep } from "../../order-group"
import { OrderGroupWorkflowEvents } from "../../events"
import {
    mirrorLineItemOfferLinksToOrderStep,
    validateSellerCartItemsStep,
    validateSellerCartShippingStep,
} from "../steps"
import {
    completeCartFields,
    prepareAdjustmentsData,
    PrepareLineItemDataInput,
    prepareLineItemData,
    prepareTaxLinesData,
} from "../utils"
import { registerUsageStep } from "../../promotion"
import { refreshOrderCommissionLinesWorkflow } from "../../commission/workflows/refresh-order-commission-lines"
import {
    prepareOfferInventoryInput,
    requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

type CompleteCartWithSplitOrdersWorkflowInput = {
    cart_id: string
}

export const THREE_DAYS = 3 * 24 * 60 * 60 * 1000
export const THIRTY_SECONDS = 30 * 1000
export const TWO_MINUTES = 2 * 60 * 1000

export const completeCartWithSplitOrdersWorkflow = createWorkflow(
    {
        name: "complete-cart-with-split-orders",
        store: true,
        idempotent: false,
        retentionTime: THREE_DAYS,
    },
    (input: CompleteCartWithSplitOrdersWorkflowInput) => {
        acquireLockStep({
            key: input.cart_id,
            timeout: THIRTY_SECONDS,
            ttl: TWO_MINUTES,
        })

        const [orderGroup, cartData] = parallelize(
            useQueryGraphStep({
                entity: "order_group",
                fields: ["cart_id"],
                filters: { cart_id: input.cart_id },
                options: {
                    isList: false,
                },
            }),
            useQueryGraphStep({
                entity: "cart",
                fields: completeCartFields,
                filters: { id: input.cart_id },
                options: {
                    isList: false,
                },
            }).config({
                name: "cart-query",
            })
        )

        const orderGroupId = transform({ orderGroup }, ({ orderGroup }) => {
            return orderGroup?.data?.id
        })

        const paymentSessions = validateCartPaymentsStep({ cart: cartData.data })

        const validate = createHook("validate", {
            input,
            cart: cartData.data,
        })

        // If order ID does not exist, we are completing the cart for the first time
        const createdOrderGroup = when("create-order-group", { orderGroupId }, ({ orderGroupId }) => {
            return !orderGroupId
        }).then(() => {
            const cartOptionIds = transform({ cart: cartData.data }, ({ cart }) => {
                return cart.shipping_methods?.map((sm) => sm.shipping_option_id)
            })
            const shippingOptionsData = useQueryGraphStep({
                entity: "shipping_option",
                fields: ['id', "shipping_profile_id", 'seller.id'],
                filters: { id: cartOptionIds },
                options: {
                    cache: {
                        enable: true,
                    },
                },
            }).config({
                name: "shipping-options-query",
            })
            validateSellerCartItemsStep({
                cart: cartData.data,
            })
            validateSellerCartShippingStep({
                cart: cartData.data,
                shippingOptions: shippingOptionsData.data as ShippingOptionDTO & { seller: SellerDTO }[],
            })
            validateShippingStep({
                cart: cartData.data,
                shippingOptions: shippingOptionsData.data,
            })
            const { sales_channel_id } = transform(
                { cart: cartData.data },
                (data) => {
                    return {
                        sales_channel_id: data.cart.sales_channel_id,
                    }
                }
            )

            const { ordersToCreate, sellerOrdersMap, offerIdsByOrderId } = transform({ cart: cartData.data, shippingOptionsData: shippingOptionsData.data }, ({ cart, shippingOptionsData }) => {
                const cartSellerIds = new Set<string>(
                    (cart.items ?? [])
                        .map((item: any) => item.offer?.seller_id)
                        .filter((id: unknown): id is string => typeof id === "string")
                )
                const sellerShippingOptionsMap = new Map()
                shippingOptionsData.forEach((so) => {
                    const sellerId = so.seller.id
                    const previous = sellerShippingOptionsMap.get(sellerId) ?? []
                    sellerShippingOptionsMap.set(sellerId, [...previous, so])
                })

                const sellerOrdersMap: Record<string, string> = {}
                const ordersToCreate: (CreateOrderDTO & { id: string })[] = []
                // positional offer ids per order; zipped with createdOrders[*].items
                // after createOrdersStep to build order_line_item_id → offer_id pairs
                const offerIdsByOrderId: Record<string, (string | null)[]> = {}

                Array.from(cartSellerIds).map((sellerId) => {
                    const sellerCartItems = (cart.items ?? []).filter(
                        (item: any) => item.offer?.seller_id === sellerId
                    )
                    const sellerShippingOptions = sellerShippingOptionsMap.get(sellerId) ?? []
                    const sellerCartShippingMethods = (cart.shipping_methods ?? []).filter((sm) => sellerShippingOptions.some((so) => so.id === sm.shipping_option_id))

                    const allItems = sellerCartItems.map((item) => {
                        // In Mercur the shipping profile lives on the offer
                        // (per-seller), not on the product. Force
                        // requires_shipping=true whenever the line carries
                        // an offer with a shipping_profile_id, otherwise
                        // every order line ends up with
                        // requires_shipping=false and the vendor
                        // fulfillment UI hides the matching shipping
                        // option. Also surface the profile onto
                        // variant.product so downstream code that reads
                        // product.shipping_profile sees it.
                        const offerShippingProfileId = (
                            item as { offer?: { shipping_profile_id?: string } | null }
                        ).offer?.shipping_profile_id
                        const itemForLineItem = offerShippingProfileId
                            ? { ...item, requires_shipping: true }
                            : item
                        const variantForLineItem =
                            item.variant && offerShippingProfileId
                                ? {
                                      ...item.variant,
                                      product: {
                                          ...(item.variant.product ?? {}),
                                          shipping_profile:
                                              (item.variant.product as { shipping_profile?: { id: string } } | undefined)
                                                  ?.shipping_profile ?? {
                                                  id: offerShippingProfileId,
                                              },
                                      },
                                  }
                                : item.variant
                        const input: PrepareLineItemDataInput = {
                            item: itemForLineItem,
                            variant: variantForLineItem,
                            cartId: cart.id,
                            unitPrice: item.unit_price,
                            isTaxInclusive: item.is_tax_inclusive,
                            taxLines: item.tax_lines ?? [],
                            adjustments: item.adjustments ?? [],
                        }
                        return prepareLineItemData(input)
                    })

                    const shippingMethods = sellerCartShippingMethods.map((sm) => {
                        return {
                            name: sm.name,
                            description: sm.description,
                            amount: sm.raw_amount ?? sm.amount,
                            is_tax_inclusive: sm.is_tax_inclusive,
                            shipping_option_id: sm.shipping_option_id,
                            data: sm.data,
                            metadata: sm.metadata,
                            tax_lines: prepareTaxLinesData(sm.tax_lines ?? []),
                            adjustments: prepareAdjustmentsData(sm.adjustments ?? []),
                        }
                    })

                    // todo: add credit lines support for child orders
                    // const creditLines = (cart.credit_lines ?? []).map(
                    //     (creditLine: CartCreditLineDTO) => {
                    //         return {
                    //             amount: creditLine.amount,
                    //             raw_amount: creditLine.raw_amount,
                    //             reference: creditLine.reference,
                    //             reference_id: creditLine.reference_id,
                    //             metadata: creditLine.metadata,
                    //         }
                    //     }
                    // )

                    const itemAdjustments = allItems
                        .map((item) => item.adjustments ?? [])
                        .flat(1)
                    const shippingAdjustments = shippingMethods
                        .map((sm) => sm.adjustments ?? [])
                        .flat(1)

                    const promoCodes = [...itemAdjustments, ...shippingAdjustments]
                        .map((adjustment) => adjustment.code)
                        .filter(Boolean)

                    const shippingAddress = cart.shipping_address
                        ? { ...cart.shipping_address }
                        : null
                    const billingAddress = cart.billing_address
                        ? { ...cart.billing_address }
                        : null

                    if (shippingAddress) {
                        delete shippingAddress.id
                    }

                    if (billingAddress) {
                        delete billingAddress.id
                    }

                    const orderId = generateEntityId(undefined, 'order')
                    ordersToCreate.push({
                        id: orderId,
                        region_id: cart.region?.id,
                        customer_id: cart.customer?.id,
                        sales_channel_id: cart.sales_channel_id,
                        status: OrderStatus.PENDING,
                        email: cart.email,
                        currency_code: cart.currency_code,
                        locale: cart.locale,
                        shipping_address: shippingAddress,
                        billing_address: billingAddress,
                        no_notification: false,
                        items: allItems,
                        shipping_methods: shippingMethods,
                        metadata: cart.metadata,
                        promo_codes: promoCodes,
                        // todo: add credit lines support for child orders
                        credit_lines: [],
                    })

                    sellerOrdersMap[sellerId] = orderId
                    offerIdsByOrderId[orderId] = sellerCartItems.map(
                        (item: any) =>
                            (item.offer?.id as string | undefined) ?? null,
                    )
                })

                return {
                    sellerOrdersMap,
                    ordersToCreate,
                    offerIdsByOrderId,
                }
            })

            const orderGroupData = transform(
                { cart: cartData.data },
                ({ cart }) => {
                    return {
                        customer_id: cart.customer?.id,
                        cart_id: cart.id,
                    } satisfies CreateOrderGroupDTO
                }
            )


            const sellerCustomerQueryFilters = transform(
                { cart: cartData.data, sellerOrdersMap },
                ({ cart, sellerOrdersMap }) => {
                    if (!cart.customer_id) {
                        return { seller_id: [], customer_id: "" }
                    }
                    return {
                        seller_id: Object.keys(sellerOrdersMap),
                        customer_id: cart.customer?.id,
                    }
                }
            )

            const existingSellerCustomerLinks = useQueryGraphStep({
                entity: "seller_customer",
                fields: ["seller_id", "customer_id"],
                filters: sellerCustomerQueryFilters,
            }).config({
                name: "existing-seller-customer-links-query",
            })

            const [createdOrderGroup, createdOrders] = parallelize(
                createOrderGroupStep(orderGroupData),
                createOrdersStep(ordersToCreate)
            )

            // Pair each created order line with its source cart line's offer
            // by zipping createdOrders[*].items with the positional offer-id
            // list we collected during ordersToCreate construction. The order
            // module preserves input item order within each created order,
            // and each per-seller order is built from exactly one filtered
            // cart-items slice, so position is sufficient — no metadata
            // carrier is needed.
            const orderLineOfferPairs = transform(
                { createdOrders, offerIdsByOrderId },
                ({ createdOrders, offerIdsByOrderId }) => {
                    const pairs: Array<{
                        order_line_item_id: string
                        offer_id: string
                    }> = []
                    for (const order of createdOrders) {
                        const offerIds = offerIdsByOrderId[order.id] ?? []
                        const items = order.items ?? []
                        for (let i = 0; i < items.length; i++) {
                            const offerId = offerIds[i]
                            if (offerId) {
                                pairs.push({
                                    order_line_item_id: items[i].id,
                                    offer_id: offerId,
                                })
                            }
                        }
                    }
                    return pairs
                }
            )

            mirrorLineItemOfferLinksToOrderStep({
                pairs: orderLineOfferPairs,
            })

            const offerReservationItems = transform(
                { createdOrders, orderLineOfferPairs },
                ({ createdOrders, orderLineOfferPairs }) => {
                    const offerByOrderLine = new Map(
                        orderLineOfferPairs.map((p) => [
                            p.order_line_item_id,
                            p.offer_id,
                        ]),
                    )
                    const offerItems: Array<{
                        id: string
                        quantity: number
                        offer?: { id: string } | null
                    }> = []
                    for (const order of createdOrders) {
                        for (const ordItem of order.items ?? []) {
                            const offerId = offerByOrderLine.get(ordItem.id)
                            offerItems.push({
                                id: ordItem.id,
                                quantity: Number(ordItem.quantity),
                                offer: offerId ? { id: offerId } : null,
                            })
                        }
                    }
                    return offerItems
                }
            )

            const uniqueOffers = transform(
                { cart: cartData.data },
                ({ cart }) => {
                    const byId = new Map<string, unknown>()
                    for (const item of cart.items ?? []) {
                        const offer = (item as { offer?: unknown }).offer as
                            | { id: string }
                            | undefined
                        if (offer?.id && !byId.has(offer.id)) {
                            byId.set(offer.id, item)
                        }
                    }
                    return Array.from(byId.keys())
                }
            )

            const { data: offersWithInventory } = useQueryGraphStep({
                entity: "offer",
                fields: requiredOfferFieldsForInventoryConfirmation,
                filters: { id: uniqueOffers },
            }).config({ name: "fetch-offers-for-reservation" })

            const formatedInventoryItems = transform(
                {
                    input: {
                        sales_channel_id,
                        items: offerReservationItems,
                        offers: offersWithInventory,
                    },
                },
                prepareOfferInventoryInput
            )

            const updateCompletedAt = transform(
                { cart: cartData.data },
                ({ cart }) => {
                    return {
                        id: cart.id,
                        completed_at: new Date(),
                    }
                }
            )

            const promotionUsage = transform(
                { cart: cartData.data },
                ({ cart }: { cart: CartWorkflowDTO }) => {
                    const promotionUsage: UsageComputedActions[] = []

                    const itemAdjustments = (cart.items ?? [])
                        .map((item) => item.adjustments ?? [])
                        .flat(1)

                    const shippingAdjustments = (cart.shipping_methods ?? [])
                        .map((item) => item.adjustments ?? [])
                        .flat(1)

                    for (const adjustment of itemAdjustments) {
                        promotionUsage.push({
                            amount: adjustment.amount,
                            code: adjustment.code!,
                        })
                    }

                    for (const adjustment of shippingAdjustments) {
                        promotionUsage.push({
                            amount: adjustment.amount,
                            code: adjustment.code!,
                        })
                    }

                    return {
                        computedActions: promotionUsage,
                        registrationContext: {
                            customer_id: cart.customer?.id ?? null,
                            customer_email: cart.email ?? null,
                        },
                    }
                }
            )

            const linksToCreate = transform(
                { cart: cartData.data, createdOrders, createdOrderGroup, sellerOrdersMap, existingSellerCustomerLinks },
                ({ cart, createdOrders, createdOrderGroup, sellerOrdersMap, existingSellerCustomerLinks }) => {
                    const links: LinkDefinition[] = createdOrders.map((order) => ({
                        [Modules.ORDER]: { order_id: order.id },
                        [Modules.CART]: { cart_id: cart.id },
                    }))

                    if (cart.promotions?.length) {
                        cart.promotions.forEach((promotion: PromotionDTO & { seller: SellerDTO }) => {
                            links.push({
                                [Modules.ORDER]: { order_id: sellerOrdersMap[promotion.seller.id] },
                                [Modules.PROMOTION]: { promotion_id: promotion.id },
                            })
                        })
                    }

                    if (isDefined(cart.payment_collection?.id)) {
                        createdOrders.forEach((order) => {
                            links.push({
                                [Modules.ORDER]: { order_id: order.id },
                                [Modules.PAYMENT]: {
                                    payment_collection_id: cart.payment_collection.id,
                                },
                            })
                        })
                    }

                    links.push(...Object.entries(sellerOrdersMap).map(([sellerId, orderId]) => ({
                        [Modules.ORDER]: { order_id: orderId },
                        [MercurModules.SELLER]: { seller_id: sellerId },
                    })))

                    // Link order group to orders
                    links.push(...createdOrders.map((order) => ({
                        [MercurModules.SELLER]: { order_group_id: createdOrderGroup.id },
                        [Modules.ORDER]: { order_id: order.id },
                    })))

                    if (cart.customer?.id) {
                        // Create seller-customer links for new relationships
                        const existingSellerIds = new Set(
                            (existingSellerCustomerLinks?.data ?? []).map((link) => link.seller_id)
                        )

                        Object.keys(sellerOrdersMap).forEach((sellerId) => {
                            if (!existingSellerIds.has(sellerId)) {
                                links.push({
                                    [MercurModules.SELLER]: { seller_id: sellerId },
                                    [Modules.CUSTOMER]: { customer_id: cart.customer?.id },
                                })
                            }
                        })
                    }

                    return links
                }
            )


            const orderEventData = transform({ createdOrders }, ({ createdOrders }) => {
                return createdOrders.map((order) => ({ id: order.id }))
            })

            createRemoteLinkStep(linksToCreate)

            parallelize(
                updateCartsStep([updateCompletedAt]),
                reserveInventoryStep(formatedInventoryItems),
                registerUsageStep(promotionUsage),
                emitEventStep({
                    eventName: OrderWorkflowEvents.PLACED,
                    data: orderEventData
                }).config({
                    name: "order-placed-event",
                }),
                emitEventStep({
                    eventName: OrderGroupWorkflowEvents.CREATED,
                    data: { id: createdOrderGroup.id },
                }).config({
                    name: "order-group-created-event",
                })
            )

            createHook("beforePaymentAuthorization", {
                input,
            })

            // Authorize payment session
            const payment = authorizePaymentSessionStep({
                id: paymentSessions![0].id,
            })

            const orderTransactions = transform(
                { payment, createdOrders },
                ({ payment, createdOrders }) => {
                    if (!payment?.captures?.length) {
                        return []
                    }

                    const transactions = createdOrders.flatMap((order) => {
                        const proportion = MathBN.div(order.total, payment.amount)

                        return (payment.captures ?? []).map((capture) => {
                            const captureAmount = capture.raw_amount ?? capture.amount
                            const proportionalAmount = MathBN.mult(captureAmount, proportion)

                            return {
                                order_id: order.id,
                                amount: proportionalAmount,
                                currency_code: payment.currency_code,
                                reference: "capture",
                                reference_id: capture.id,
                            }
                        })
                    })

                    return transactions
                }
            )

            const orderIds = transform({ createdOrders }, ({ createdOrders }) => {
                return createdOrders.map((order) => order.id)
            })

            parallelize(
                addOrderTransactionStep(orderTransactions),
                refreshOrderCommissionLinesWorkflow.runAsStep({
                    input: {
                        order_ids: orderIds
                    }
                }))

            createHook("orderGroupCreated", {
                order_group_id: createdOrderGroup.id,
                cart_id: cartData.data.id,
            })

            return createdOrderGroup
        })

        releaseLockStep({
            key: input.cart_id,
        })

        const result = transform({ createdOrderGroup, orderGroupId }, ({ createdOrderGroup, orderGroupId }) => {
            return { order_group_id: createdOrderGroup?.id ?? orderGroupId }
        })

        return new WorkflowResponse(result, {
            hooks: [validate],
        })
    }
)
