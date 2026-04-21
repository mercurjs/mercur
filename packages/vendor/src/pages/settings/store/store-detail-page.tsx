import React, { Children, ReactNode } from "react";
import { Alert, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import components from "virtual:mercur/components";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useMe, useSubscription } from "@/hooks/api";
import { SellerStatus } from "@mercurjs/types";

import { StoreAddressSection } from "./_components/store-address-section";
import { StoreTimeOffSection } from "./_components/store-time-off-section";
import { StoreGeneralSection } from "./_components/store-general-section";
import { StoreSubscriptionSection } from "./_components/store-subscription-section";
import { StorePaymentDetailsSection } from "./_components/store-payment-details-section";
import { StoreProfessionalDetailsSection } from "./_components/store-professional-details-section";
import {
  StoreDetailHeader,
  StoreDetailTitle,
  StoreDetailActions,
  StoreDetailEditButton,
} from "./_components/store-detail-header";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();
  const { seller_member, isPending, isError, error } = useMe();
  const {
    subscription_plan,
    subscription_override,
    isPending: isSubscriptionPending,
  } = useSubscription();

  const seller = seller_member?.seller;

  if (isPending || isSubscriptionPending || !seller) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={3} />;
  }

  if (isError) {
    throw error;
  }

  const statusAlert = (() => {
    switch (seller.status) {
      case SellerStatus.SUSPENDED:
        return {
          variant: "error" as const,
          title: t("store.alert.suspended.title"),
          description:
            seller.status_reason || t("store.alert.suspended.description"),
        };
      case SellerStatus.TERMINATED:
        return {
          variant: "error" as const,
          title: t("store.alert.terminated.title"),
          description:
            seller.status_reason || t("store.alert.terminated.description"),
        };
      default:
        return null;
    }
  })();

  const StoreSetup = components.StoreSetup as
    | React.ComponentType<{ seller: any }>
    | undefined;

  const StatusBanner = () => (
    <>
      {StoreSetup && <StoreSetup seller={seller} />}
      {statusAlert && (
        <Alert variant={statusAlert.variant} dismissible className="p-5">
          <div className="text-ui-fg-subtle txt-small pb-2 font-medium leading-[20px]">
            {statusAlert.title}
          </div>
          <Text className="text-ui-fg-subtle txt-small leading-normal">
            {statusAlert.description}
          </Text>
        </Alert>
      )}
    </>
  );

  if (Children.count(children) > 0) {
    return (
      <TwoColumnPage data={seller} hasOutlet>
        {children}
      </TwoColumnPage>
    );
  }

  return (
    <TwoColumnPage data={seller} hasOutlet>
      <TwoColumnPage.Main>
        <StatusBanner />
        <StoreGeneralSection seller={seller} />
        <StoreTimeOffSection seller={seller} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <StoreAddressSection seller={seller} />
        <StoreProfessionalDetailsSection seller={seller} />
        <StorePaymentDetailsSection seller={seller} />
        <StoreSubscriptionSection
          subscription_plan={subscription_plan}
          subscription_override={subscription_override}
        />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const StoreDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: StoreGeneralSection,
  MainPaymentDetailsSection: StorePaymentDetailsSection,
  MainProfessionalDetailsSection: StoreProfessionalDetailsSection,
  MainTimeOffSection: StoreTimeOffSection,
  SidebarAddressSection: StoreAddressSection,
  SidebarSubscriptionSection: StoreSubscriptionSection,
  Header: StoreDetailHeader,
  HeaderTitle: StoreDetailTitle,
  HeaderActions: StoreDetailActions,
  HeaderEditButton: StoreDetailEditButton,
});
