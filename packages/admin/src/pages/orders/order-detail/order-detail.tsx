import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { useOrder, useOrderPreview } from "../../../hooks/api/orders";
import { ActiveOrderClaimSection } from "./components/active-order-claim-section";
import { ActiveOrderExchangeSection } from "./components/active-order-exchange-section";
import { ActiveOrderReturnSection } from "./components/active-order-return-section";
import { OrderActiveEditSection } from "./components/order-active-edit-section";
import { OrderActivitySection } from "./components/order-activity-section";
import { OrderCustomerSection } from "./components/order-customer-section";
import { OrderFulfillmentSection } from "./components/order-fulfillment-section";
import { OrderGeneralSection } from "./components/order-general-section";
import { OrderPaymentSection } from "./components/order-payment-section";
import { OrderSummarySection } from "./components/order-summary-section";
import { DEFAULT_FIELDS } from "./constants";
import { orderLoader } from "./loader";
import { OrderRemainingOrdersGroupSection } from "./components/order-remaining-orders-group-section";

export const OrderDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof orderLoader>
  >;

  const { id } = useParams();

  const query = useLinkQuery("order", DEFAULT_FIELDS);

  const { order: rawOrder, isLoading, isError, error } = useOrder(
    id!,
    query,
    {
      initialData,
    },
  );

  // TODO: Retrieve endpoints don't have an order ability, so a JS sort until this is available
  const order = rawOrder
    ? {
        ...rawOrder,
        items: [...rawOrder.items].sort((itemA, itemB) => {
          if (itemA.created_at > itemB.created_at) {
            return 1;
          }
          if (itemA.created_at < itemB.created_at) {
            return -1;
          }
          return 0;
        }),
      }
    : rawOrder;

  const { order: orderPreview, isLoading: isPreviewLoading } = useOrderPreview(
    id!,
  );

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
      data-testid="order-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="OrderActiveEditSection">
              <OrderActiveEditSection order={order} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ActiveOrderClaimSection">
              <ActiveOrderClaimSection orderPreview={orderPreview!} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ActiveOrderExchangeSection">
              <ActiveOrderExchangeSection orderPreview={orderPreview!} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="ActiveOrderReturnSection">
              <ActiveOrderReturnSection orderPreview={orderPreview!} />
            </LayoutComposer.Entry>
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
            <LayoutComposer.Entry id="OrderRemainingOrdersGroupSection">
              <OrderRemainingOrdersGroupSection />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
