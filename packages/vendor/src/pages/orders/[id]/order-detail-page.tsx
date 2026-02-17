import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useOrder } from "@hooks/api/orders";

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

  if (isLoading || !order) {
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
        <TwoColumnPage data={order} hasOutlet>
          <TwoColumnPage.Main>
            <OrderGeneralSection order={order} />
            <OrderSummarySection order={order} />
            <OrderPaymentSection order={order} />
            <OrderFulfillmentSection order={order} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <OrderCustomerSection order={order} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const OrderDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: OrderGeneralSection,
  MainSummarySection: OrderSummarySection,
  MainPaymentSection: OrderPaymentSection,
  MainFulfillmentSection: OrderFulfillmentSection,
  SidebarCustomerSection: OrderCustomerSection,
});
