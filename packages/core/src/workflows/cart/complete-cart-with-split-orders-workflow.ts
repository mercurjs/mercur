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
    validateShippingStep,
} from "@medusajs/medusa/core-flows"
import { CreateOrderGroupDTO } from "@mercurjs/types"

import { SELLER_MODULE } from "../../modules/seller"
import { createOrderGroupStep } from "../order-group"
import { OrderGroupWorkflowEvents } from "../events"
import {
    validateSellerCartItemsStep,
    validateSellerCartShippingStep,
} from "./steps"
import {
    completeCartFields,
    prepareAdjustmentsData,
    PrepareLineItemDataInput,
    prepareLineItemData,
    prepareTaxLinesData,
    prepareConfirmInventoryInput,
} from "./utils"
import { registerUsageStep } from "../promotion"

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

        const [orderCart, cartData] = parallelize(
            useQueryGraphStep({
                entity: "order_cart",
                fields: ["cart_id", "order_id"],
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

        const orderId = transform({ orderCart }, ({ orderCart }) => {
            return orderCart?.data?.order_id
        })

        const validate = createHook("validate", {
            input,
            cart: cartData.data,
        })

        // If order ID does not exist, we are completing the cart for the first time
        const order = when("create-order", { orderId }, ({ orderId }) => {
            return !orderId
        }).then(() => {
            const cartOptionIds = transform({ cart: cartData.data }, ({ cart }) => {
                return cart.shipping_methods?.map((sm) => sm.shipping_option_id)
            })
            const cartProductIds = transform({ cart: cartData.data }, ({ cart }) => {
                return cart.items?.map((item) => item.variant?.product_id)
            })

            const sellerProductsData = useQueryGraphStep({
                entity: "seller_product",
                fields: ["seller_id", "product_id"],
                filters: { product_id: cartProductIds },
                options: {
                    cache: {
                        enable: true,
                    },
                },
            }).config({
                name: "seller-products-query",
            })

            const sellerShippingOptionsData = useQueryGraphStep({
                entity: "seller_shipping_option",
                fields: ["seller_id", 'shipping_option.id', 'shipping_option.shipping_profile_id'],
                filters: { shipping_option_id: cartOptionIds },
                options: {
                    cache: {
                        enable: true,
                    },
                },
            }).config({
                name: "shipping-options-query",
            })

            const shippingOptionsData = transform({ sellerShippingOptionsData }, ({ sellerShippingOptionsData }) => {
                return sellerShippingOptionsData.data.map((sso) => ({
                    id: sso.shipping_option.id,
                    shipping_profile_id: sso.shipping_option.shipping_profile_id,
                })) as ShippingOptionDTO[]
            })

            validateSellerCartItemsStep({
                cart: cartData.data,
                sellerProducts: sellerProductsData.data,
            })
            validateSellerCartShippingStep({
                cart: cartData.data,
                sellerProducts: sellerProductsData.data,
                sellerShippingOptions: sellerShippingOptionsData.data,
            })
            validateShippingStep({
                cart: cartData.data,
                shippingOptions: shippingOptionsData,
            })

            const { variants, sales_channel_id } = transform(
                { cart: cartData.data },
                (data) => {
                    const variantsMap: Record<string, any> = {}
                    const allItems = data.cart?.items?.map((item) => {
                        variantsMap[item.variant_id] = item.variant
                        return {
                            id: item.id,
                            variant_id: item.variant_id,
                            quantity: item.quantity,
                        }
                    })

                    return {
                        variants: Object.values(variantsMap),
                        items: allItems,
                        sales_channel_id: data.cart.sales_channel_id,
                    }
                }
            )

            const { ordersToCreate, sellerOrdersMap } = transform({ cart: cartData.data, sellerProducts: sellerProductsData.data, sellerShippingOptions: sellerShippingOptionsData.data }, ({ cart, sellerProducts, sellerShippingOptions }) => {
                const productSellerMap = new Map<string, string>(sellerProducts.map((sp) => [sp.product_id, sp.seller_id]))
                const sellerShippingOptionsMap = new Map<string, string>(sellerShippingOptions.map((sso) => [sso.shipping_option_id, sso.seller_id]))
                const cartSellerIds = new Set<string>(sellerProducts.map((sp) => sp.seller_id))

                const sellerOrdersMap: Record<string, string> = {}
                const ordersToCreate: (CreateOrderDTO & { id: string })[] = []

                Array.from(cartSellerIds).map((sellerId) => {
                    const sellerCartItems = (cart.items ?? []).filter((item) => productSellerMap.get(item.variant.product_id!) === sellerId)
                    const sellerCartShippingMethods = (cart.shipping_methods ?? []).filter((sm) => sellerShippingOptionsMap.get(sm.shipping_option_id!) === sellerId)

                    const allItems = sellerCartItems.map((item) => {
                        const input: PrepareLineItemDataInput = {
                            item,
                            variant: item.variant,
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

                    const orderId = generateEntityId('order')
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
                })

                return {
                    sellerOrdersMap,
                    ordersToCreate,
                }
            })

            const orderGroupData = transform(
                { cart: cartData.data },
                ({ cart }) => {
                    return {
                        customer_id: cart.customer_id
                    } satisfies CreateOrderGroupDTO
                }
            )

            const [createdOrderGroup, createdOrders] = parallelize(
                createOrderGroupStep(orderGroupData),
                createOrdersStep(ordersToCreate)
            )

            const reservationItemsData = transform(
                { createdOrders },
                ({ createdOrders }) =>
                    createdOrders.flatMap((order) => order.items!).map((i) => ({
                        variant_id: i.variant_id,
                        quantity: i.quantity,
                        id: i.id,
                    }))
            )

            const formatedInventoryItems = transform(
                {
                    input: {
                        sales_channel_id,
                        variants,
                        items: reservationItemsData,
                    },
                },
                prepareConfirmInventoryInput
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
                            customer_id: cart.customer?.id || null,
                            customer_email: cart.email || null,
                        },
                    }
                }
            )

            const linksToCreate = transform(
                { cart: cartData.data, createdOrders, createdOrderGroup, sellerOrdersMap },
                ({ cart, createdOrders, createdOrderGroup, sellerOrdersMap }) => {
                    const links: LinkDefinition[] = createdOrders.map((order) => ({
                        [Modules.ORDER]: { order_id: order.id },
                        [Modules.CART]: { cart_id: cart.id },
                    }))

                    if (cart.promotions?.length) {
                        cart.promotions.forEach((promotion: PromotionDTO) => {
                            links.push({
                                [Modules.ORDER]: { order_id: order.id },
                                [Modules.PROMOTION]: { promotion_id: promotion.id },
                            })
                        })
                    }

                    if (isDefined(cart.payment_collection?.id)) {
                        links.push({
                            [Modules.ORDER]: { order_id: order.id },
                            [Modules.PAYMENT]: {
                                payment_collection_id: cart.payment_collection.id,
                            },
                        })
                    }

                    links.push(...Object.entries(sellerOrdersMap).map(([sellerId, orderId]) => ({
                        [SELLER_MODULE]: { seller_id: sellerId },
                        [Modules.ORDER]: { order_id: orderId },
                    })))

                    // Link order group to orders
                    links.push(...createdOrders.map((order) => ({
                        [SELLER_MODULE]: { order_group_id: createdOrderGroup.id },
                        [Modules.ORDER]: { order_id: order.id },
                    })))

                    return links
                }
            )


            const orderEventData = transform({ createdOrders }, ({ createdOrders }) => {
                return createdOrders.map((order) => ({ id: order.id }))
            })

            parallelize(
                createRemoteLinkStep(linksToCreate),
                updateCartsStep([updateCompletedAt]),
                reserveInventoryStep(formatedInventoryItems),
                registerUsageStep(promotionUsage),
                emitEventStep({
                    eventName: OrderWorkflowEvents.PLACED,
                    data: orderEventData
                }),
                emitEventStep({
                    eventName: OrderGroupWorkflowEvents.CREATED,
                    data: { id: createdOrderGroup.id },
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
                { payment, createdOrder },
                ({ payment, createdOrder }) => {
                    const transactions =
                        (payment &&
                            payment?.captures?.map((capture) => {
                                return {
                                    order_id: createdOrder.id,
                                    amount: capture.raw_amount ?? capture.amount,
                                    currency_code: payment.currency_code,
                                    reference: "capture",
                                    reference_id: capture.id,
                                }
                            })) ??
                        []

                    return transactions
                }
            )

            addOrderTransactionStep(orderTransactions)

            createHook("orderGroupCreated", {
                order_group_id: createdOrderGroup.id,
                cart_id: cartData.data.id,
                sellerOrdersMap: sellerOrdersMap
            })

            return {
                order_group_id: createdOrderGroup.id,
                sellerOrdersMap: sellerOrdersMap
            }
        })

        releaseLockStep({
            key: input.cart_id,
        })

        const result = transform({ order, orderId }, ({ order, orderId }) => {
            return { id: order?.id ?? orderId }
        })

        return new WorkflowResponse(result, {
            hooks: [validate],
        })
    }
)
