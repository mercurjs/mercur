import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  detailPageDefaultEntries,
  LayoutComposer,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useOrder, useOrderPreview } from "@hooks/api/orders";

import { ActiveOrderClaimSection } from "./_components/active-order-claim-section";
import { ActiveOrderExchangeSection } from "./_components/active-order-exchange-section";
import { ActiveOrderReturnSection } from "./_components/active-order-return-section";
import { OrderActiveEditSection } from "./_components/order-active-edit-section";
import { OrderActivitySection } from "./_components/order-activity-section";
import { OrderCustomerSection } from "./_components/order-customer-section";
import { OrderFulfillmentSection } from "./_components/order-fulfillment-section";
import { OrderGeneralSection } from "./_components/order-general-section";
import { OrderPaymentSection } from "./_components/order-payment-section";
import { OrderSummarySection } from "./_components/order-summary-section";
import { DEFAULT_FIELDS } from "./constants";

import type { loader } from "./loader";

export const OrderDetailPage = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();

  const query = useLinkQuery("order", DEFAULT_FIELDS);

  const { order, isLoading, isError, error } = useOrder(
    id!,
    query,
    {
      initialData,
    },
  );

  const { order: orderPreview, isLoading: isPreviewLoading } = useOrderPreview(
    id!,
  );

  if (order) {
    order.items = order.items.sort((itemA: any, itemB: any) => {
      if (itemA.created_at > itemB.created_at) {
        return 1;
      }

      if (itemA.created_at < itemB.created_at) {
        return -1;
      }

      return 0;
    });
  }

  if (isLoading || !order || isPreviewLoading) {
    return (
      <TwoColumnPageSkeleton mainSections={4} sidebarSections={2} showJSON />
    );
  }

  if (isError) {
    throw error;
  }

  return (
    <LayoutComposer
      widgetsZonePrefix="orders.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={order}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="OrderActiveEditSection">
              <OrderActiveEditSection order={order} />
            </LayoutComposer.Entry>
            {orderPreview && (
              <LayoutComposer.Entry id="ActiveOrderClaimSection">
                <ActiveOrderClaimSection orderPreview={orderPreview} />
              </LayoutComposer.Entry>
            )}
            {orderPreview && (
              <LayoutComposer.Entry id="ActiveOrderExchangeSection">
                <ActiveOrderExchangeSection orderPreview={orderPreview} />
              </LayoutComposer.Entry>
            )}
            {orderPreview && (
              <LayoutComposer.Entry id="ActiveOrderReturnSection">
                <ActiveOrderReturnSection orderPreview={orderPreview} />
              </LayoutComposer.Entry>
            )}
            <LayoutComposer.Entry id="OrderGeneralSection">
              <OrderGeneralSection order={order} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OrderSummarySection">
              <OrderSummarySection order={order} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OrderPaymentSection">
              <OrderPaymentSection order={order} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OrderFulfillmentSection">
              <OrderFulfillmentSection order={order} />
            </LayoutComposer.Entry>
            {detailPageDefaultEntries(order)}
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="OrderCustomerSection">
              <OrderCustomerSection order={order} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="OrderActivitySection">
              <OrderActivitySection order={order} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
