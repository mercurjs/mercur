import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";

import { useOrder } from "@hooks/api/orders";
import { useReturnRequest } from "@hooks/api/return-requests";

import { ReturnRequestCustomerSection } from "./_components/return-request-customer-section";
import { ReturnRequestGeneralSection } from "./_components/return-request-general-section";
import { ReturnRequestItemsSection } from "./_components/return-request-items-section";
import { ReturnRequestOrderSection } from "./_components/return-request-order-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const {
    return_request: returnRequest,
    isLoading,
    isError,
    error,
  } = useReturnRequest(id!, undefined, {
    placeholderData: initialData,
  });

  const { order } = useOrder(
    returnRequest?.order_id ?? "",
    { fields: "id,display_id,currency_code,email,*items" },
    { enabled: Boolean(returnRequest?.order_id) },
  );

  if (isLoading || !returnRequest) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage hasOutlet data={returnRequest}>
          <TwoColumnPage.Main>
            <ReturnRequestGeneralSection returnRequest={returnRequest} />
            <ReturnRequestItemsSection returnRequest={returnRequest} order={order} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <ReturnRequestCustomerSection returnRequest={returnRequest} />
            <ReturnRequestOrderSection order={order} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const ReturnRequestDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: ReturnRequestGeneralSection,
  MainItemsSection: ReturnRequestItemsSection,
  SidebarCustomerSection: ReturnRequestCustomerSection,
  SidebarOrderSection: ReturnRequestOrderSection,
});
