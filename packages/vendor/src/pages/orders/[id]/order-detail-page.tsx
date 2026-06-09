import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
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

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();

  const { order, isLoading, isError, error } = useOrder(
    id!,
    {
      fields: DEFAULT_FIELDS,
    },
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
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={order} hasOutlet showMetadata showJSON>
          <TwoColumnPage.Main>
            <OrderActiveEditSection order={order} />
            {orderPreview && (
              <>
                <ActiveOrderClaimSection orderPreview={orderPreview} />
                <ActiveOrderExchangeSection orderPreview={orderPreview} />
                <ActiveOrderReturnSection orderPreview={orderPreview} />
              </>
            )}
            <OrderGeneralSection order={order} />
            <OrderSummarySection order={order} />
            <OrderPaymentSection order={order} />
            <OrderFulfillmentSection order={order} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OrderCustomerSection order={order} />
            <OrderActivitySection order={order} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const OrderDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainActiveEditSection: OrderActiveEditSection,
  MainActiveClaimSection: ActiveOrderClaimSection,
  MainActiveExchangeSection: ActiveOrderExchangeSection,
  MainActiveReturnSection: ActiveOrderReturnSection,
  MainGeneralSection: OrderGeneralSection,
  MainSummarySection: OrderSummarySection,
  MainPaymentSection: OrderPaymentSection,
  MainFulfillmentSection: OrderFulfillmentSection,
  SidebarCustomerSection: OrderCustomerSection,
  SidebarActivitySection: OrderActivitySection,
});
