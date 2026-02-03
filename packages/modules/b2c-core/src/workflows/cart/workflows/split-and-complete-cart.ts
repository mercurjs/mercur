import {
  MathBN,
  MedusaError,
  Modules,
  OrderStatus,
  OrderWorkflowEvents,
} from "@medusajs/framework/utils";
import {
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import {
  authorizePaymentSessionStep,
  createOrdersStep,
  createRemoteLinkStep,
  emitEventStep,
  reserveInventoryStep,
  updateCartsStep,
  useRemoteQueryStep,
  validateCartPaymentsStep,
} from "@medusajs/medusa/core-flows";
import { UsageComputedActions } from "@medusajs/types";
import {
  CartShippingMethodDTO,
  CartWorkflowDTO,
} from "@medusajs/types/dist/cart";
import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/workflows-sdk";

import { OrderSetWorkflowEvents } from "@mercurjs/framework";
import { MARKETPLACE_MODULE } from "../../../modules/marketplace";
import { SELLER_MODULE } from "../../../modules/seller";

import { registerUsageStep } from "../../promotions/steps";
import { createSplitOrderPaymentsStep } from "../../split-order-payment/steps";
import {
  createOrderSetStep,
  validateCartSellersStep,
  validateCartShippingOptionsStep,
} from "../steps";
import {
  completeCartFields,
  prepareConfirmInventoryInput,
  prepareLineItemData,
  prepareTaxLinesData,
} from "../utils";

type SplitAndCompleteCartWorkflowInput = {
  id: string;
};

export const splitAndCompleteCartWorkflow = createWorkflow(
  {
    name: "split-and-complete-cart",
    idempotent: true,
  },
  function (input: SplitAndCompleteCartWorkflowInput) {
    const existingOrderSet = useRemoteQueryStep({
      entry_point: "order_set",
      fields: ["id", "cart_id"],
      variables: {
        filters: {
          cart_id: input.id,
        },
      },
      list: false,
    }).config({ name: "order-set-query" });

    const orderSet = when({ existingOrderSet }, ({ existingOrderSet }) => {
      return !existingOrderSet;
    }).then(() => {
      const cart = useRemoteQueryStep({
        entry_point: "cart",
        fields: completeCartFields,
        variables: {
          id: input.id,
        },
        list: false,
      }).config({ name: "cart-query" });

      validateCartSellersStep(
        transform({ cart }, ({ cart }) => ({
          line_items: cart.items,
        }))
      );

      const validateCartShippingOptionsInput = transform(
        { cart },
        ({ cart }) => ({
          cart_id: cart.id,
          option_ids: cart.shipping_methods.map(
            (method) => method.shipping_option_id
          ),
        })
      );

      const { sellerProducts, sellerShippingOptions } =
        validateCartShippingOptionsStep(validateCartShippingOptionsInput);

      const paymentSessions = validateCartPaymentsStep({ cart });

      const payment = authorizePaymentSessionStep({
        id: paymentSessions[0].id,
        context: { cart_id: cart.id },
      });

      const { ordersToCreate, sellers, variants } = transform(
        { cart, sellerProducts, sellerShippingOptions },
        ({ cart, sellerProducts, sellerShippingOptions }) => {
          const productSellerMap = new Map<string, string>(
            sellerProducts.map((sp) => [sp.product_id, sp.seller_id])
          );
          const shippingOptionSellerMap = new Map<string, string>(
            sellerShippingOptions.map((sp) => [
              sp.shipping_option_id,
              sp.seller_id,
            ])
          );
          const sellerLineItemsMap = new Map<string, any[]>();
          const sellerShippingMethodsMap = new Map<
            string,
            CartShippingMethodDTO
          >();
          const variantsMap = new Map<string, any>();

          cart.items.forEach((item) => {
            const sellerId = productSellerMap.get(item.variant.product_id)!;
            const lineItems = sellerLineItemsMap.get(sellerId) || [];
            lineItems.push(item);
            sellerLineItemsMap.set(sellerId, lineItems);

            variantsMap.set(item.variant.id, item.variant);
          });

          cart.shipping_methods.forEach((method) => {
            const sellerId = shippingOptionSellerMap.get(
              method.shipping_option_id
            )!;
            sellerShippingMethodsMap.set(sellerId, method);
          });

          const sellers = Array.from(sellerLineItemsMap.keys());

          const ordersToCreate = sellers.map((sellerId) => {
            const sm = sellerShippingMethodsMap.get(sellerId);

            if (!sm) {
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Seller shipping method not found!"
              );
            }

            const items = sellerLineItemsMap.get(sellerId)!.map((item) =>
              prepareLineItemData({
                item,
                variant: item.variant,
                unitPrice: item.unit_price,
                compareAtUnitPrice: item.compare_at_unit_price,
                isTaxInclusive: item.is_tax_inclusive,
                quantity: item.quantity,
                metadata: item?.metadata,
                taxLines: item.tax_lines ?? [],
                adjustments: item.adjustments ?? [],
              })
            );

            const itemAdjustments = items
              .map((item) => item.adjustments ?? [])
              .flat(1);

            const promoCodes = [...itemAdjustments]
              .map((adjustment) => adjustment.code)
              .filter(Boolean);

            return {
              region_id: cart.region?.id,
              customer_id: cart.customer?.id,
              sales_channel_id: cart.sales_channel_id,
              status: OrderStatus.PENDING,
              email: cart.email,
              currency_code: cart.currency_code,
              shipping_address: cart.shipping_address,
              billing_address: cart.billing_address,
              no_notification: false,
              items,
              promo_codes: promoCodes,
              shipping_methods: [
                {
                  name: sm.name,
                  description: sm.description,
                  amount: sm.amount,
                  is_tax_inclusive: sm.is_tax_inclusive,
                  shipping_option_id: sm.shipping_option_id,
                  data: sm.data,
                  metadata: sm.metadata,
                  tax_lines: prepareTaxLinesData(sm.tax_lines ?? []),
                },
              ],
            };
          });

          return {
            ordersToCreate,
            sellers,
            variants: Array.from(variantsMap.values()),
          };
        }
      );

      const promotionUsage = transform(
        { cart },
        ({ cart }: { cart: CartWorkflowDTO }) => {
          const promotionUsage: UsageComputedActions[] = [];

          const itemAdjustments = (cart.items ?? [])
            .map((item) => item.adjustments ?? [])
            .flat(1);

          const shippingAdjustments = (cart.shipping_methods ?? [])
            .map((item) => item.adjustments ?? [])
            .flat(1);

          for (const adjustment of itemAdjustments) {
            promotionUsage.push({
              amount: adjustment.amount,
              code: adjustment.code!,
            });
          }

          for (const adjustment of shippingAdjustments) {
            promotionUsage.push({
              amount: adjustment.amount,
              code: adjustment.code!,
            });
          }

          return {computedActions: promotionUsage, registrationContext: { customer_id: cart.customer?.id ?? null, customer_email: cart.email ?? null}};
        }
      );

      registerUsageStep(promotionUsage);

      const orderSet = createOrderSetStep({
        cart_id: cart.id,
        customer_id: cart.customer_id,
        sales_channel_id: cart.sales_channel_id,
        payment_collection_id: payment.payment_collection_id,
      });

      const createdOrders = createOrdersStep(ordersToCreate);

      const splitPaymentsToCreate = transform(
        { createdOrders, payment },
        ({ createdOrders, payment }) => {
          return createdOrders.map((order) => ({
            order_id: order.id,
            status: "pending",
            currency_code: order.currency_code,
            authorized_amount: MathBN.convert(
              order.summary?.accounting_total || 0
            ).toNumber(),
            payment_collection_id: payment!.payment_collection_id,
          }));
        }
      );
      const reservationItemsData = transform(
        { createdOrders },
        ({ createdOrders }) =>
          createdOrders.reduce<
            {
              variant_id: string;
              quantity: number;
              id: string;
            }[]
          >((acc, order) => {
            acc.push(
              ...order.items!.map((i) => ({
                variant_id: i.variant_id!,
                quantity: i.quantity,
                id: i.id,
              }))
            );
            return acc;
          }, [])
      );

      const updateCartInput = transform({ cart }, ({ cart }) => ({
        id: cart.id,
        completed_at: new Date(),
      }));

      const formatedInventoryItems = transform(
        {
          input: {
            sales_channel_id: cart.sales_channel_id,
            variants,
            items: reservationItemsData,
          },
        },
        prepareConfirmInventoryInput
      );

      const links = transform(
        {
          createdOrders,
          sellers,
          orderSet,
          cart,
        },
        ({ createdOrders, sellers, orderSet, cart }) => {
          const sellerOrderLinks = createdOrders.map((order, index) => ({
            [SELLER_MODULE]: {
              seller_id: sellers[index],
            },
            [Modules.ORDER]: {
              order_id: order.id,
            },
          }));

          const orderSetOrderLinks = createdOrders.map((order) => ({
            [MARKETPLACE_MODULE]: {
              order_set_id: orderSet.id,
            },
            [Modules.ORDER]: {
              order_id: order.id,
            },
          }));

          const orderPaymentLinks = createdOrders.map((order) => ({
            [Modules.ORDER]: {
              order_id: order.id,
            },
            [Modules.PAYMENT]: {
              payment_collection_id: cart.payment_collection.id,
            },
          }));

          return [
            ...sellerOrderLinks,
            ...orderSetOrderLinks,
            ...orderPaymentLinks,
          ];
        }
      );

      const orderEvents = transform({ createdOrders }, ({ createdOrders }) => ({
        eventName: OrderWorkflowEvents.PLACED,
        data: {
          order_ids: createdOrders.map((order) => order.id),
        },
      }));

      parallelize(
        createSplitOrderPaymentsStep(splitPaymentsToCreate),
        createRemoteLinkStep(links),
        reserveInventoryStep(formatedInventoryItems),
        updateCartsStep([updateCartInput]),
        emitEventStep(orderEvents),
        emitEventStep({
          eventName: OrderSetWorkflowEvents.PLACED,
          data: {
            id: orderSet.id,
          },
        }).config({ name: "order-set-event" })
      );

      return orderSet;
    });

    const orderSetId = transform(
      { orderSet, existingOrderSet },
      ({ orderSet, existingOrderSet }) =>
        orderSet ? orderSet.id : existingOrderSet.id
    );

    const orderSetCreatedHook = createHook("orderSetCreated", {
      orderSetId,
    });
    return new WorkflowResponse(
      { id: orderSetId },
      {
        hooks: [orderSetCreatedHook],
      }
    );
  }
);
