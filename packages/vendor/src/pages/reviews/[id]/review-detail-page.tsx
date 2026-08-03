import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";

import { useReview } from "@hooks/api/reviews";

import { ReviewGeneralSection } from "./_components/review-general-section";
import { CustomerSection } from "./_components/customer-section";
import { OrderSection } from "./_components/order-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { review, isLoading, isError, error } = useReview(id!, undefined, {
    placeholderData: initialData,
  });

  if (isLoading || !review) {
    return <TwoColumnPageSkeleton mainSections={1} sidebarSections={2} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage hasOutlet data={review}>
          <TwoColumnPage.Main>
            <ReviewGeneralSection review={review} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <CustomerSection review={review} />
            <OrderSection review={review} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const ReviewDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: ReviewGeneralSection,
  SidebarCustomerSection: CustomerSection,
  SidebarOrderSection: OrderSection,
});
