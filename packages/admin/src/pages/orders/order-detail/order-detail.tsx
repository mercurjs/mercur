import { Children, ComponentProps, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
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
import { OrderRemainingOrdersGroupSection } from "./components/order-remaining-orders-group-section";
import { DEFAULT_FIELDS } from "./constants";
import { OrderDetailProvider, useOrderDetailContext } from "./context";
import { orderLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof orderLoader>
  >;

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

  // TODO: Retrieve endpoints don't have an order ability, so a JS sort until this is available
  if (order) {
    order.items = order.items.sort((itemA: { created_at: string }, itemB: { created_at: string }) => {
      if (itemA.created_at > itemB.created_at) {
        return 1;
      }

      if (itemA.created_at < itemB.created_at) {
        return -1;
      }

      return 0;
    });
  }

  const {
    order: orderPreview,
    isLoading: isPreviewLoading,
    isError: isPreviewError,
    error: previewError,
  } = useOrderPreview(id!);

  if (isLoading || !order || isPreviewLoading) {
    return (
      <TwoColumnPageSkeleton mainSections={4} sidebarSections={2} showJSON />
    );
  }

  if (isError) {
    throw error;
  }

  if (isPreviewError) {
    throw previewError ?? new Error("Failed to load order preview");
  }

  if (!orderPreview) {
    throw new Error("Order preview is not available");
  }

  return (
    <OrderDetailProvider order={order} orderPreview={orderPreview}>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <Layout>
          <TwoColumnPage.Main data-testid="order-detail-main">
            <OrderActiveEditSection />
            <ActiveOrderClaimSection />
            <ActiveOrderExchangeSection />
            <ActiveOrderReturnSection />
            <OrderGeneralSection />
            <OrderSummarySection />
            <OrderPaymentSection />
            <OrderFulfillmentSection />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar data-testid="order-detail-sidebar">
            <OrderCustomerSection />
            <OrderActivitySection />
            <OrderRemainingOrdersGroupSection />
          </TwoColumnPage.Sidebar>
        </Layout>
      )}
    </OrderDetailProvider>
  );
};

const Layout = ({
  children,
  ...props
}: Omit<ComponentProps<typeof TwoColumnPage>, "data"> & {
  children: ReactNode;
}) => {
  const { order } = useOrderDetailContext();
  return (
    <TwoColumnPage
      showJSON
      showMetadata
      hasOutlet
      data={order}
      data-testid="order-detail-page"
      {...props}
    >
      {children}
    </TwoColumnPage>
  );
};

export const OrderDetailPage = Object.assign(Root, {
  Layout,
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
  SidebarRemainingOrdersGroupSection: OrderRemainingOrdersGroupSection,

  useContext: useOrderDetailContext,
});
