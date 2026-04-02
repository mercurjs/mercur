import { ReactNode, Children, useState } from "react";
import { useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "../../../../components/common/skeleton";
import { TwoColumnPage } from "../../../../components/layout/pages";
import { useSeller } from "@/hooks/api";
import { SellerStatus } from "@mercurjs/types";

import { StoreGeneralSection } from "./store-general-section";
import { StorePaymentDetailsSection } from "./store-payment-details-section";
import { StoreCompanyDetailsSection } from "./store-company-details-section";
import { StoreConfigurationSection } from "./store-configuration-section";
import { StoreAddressSection } from "./store-address-section";
import { StoreSubscriptionSection } from "./store-subscription-section";
import { StoreMembersSection } from "./store-members-section";
import { StoreRequestSection } from "./store-request-section";
import {
  StoreDetailHeader,
  StoreDetailTitle,
  StoreDetailActions,
  StoreDetailEditButton,
} from "./store-detail-header";

const TABS = [{ value: "users", label: "Users" }] as const;

type Tab = (typeof TABS)[number]["value"];

const TabBar = ({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) => {
  return (
    <div className="flex items-center gap-x-3 py-2">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`txt-compact-medium-plus rounded-full px-4 py-1.5 transition-colors ${
              isActive
                ? "border-ui-border-base bg-ui-bg-base shadow-borders-base text-ui-fg-base"
                : "text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const { seller, isLoading, isError, error } = useSeller(id!);

  if (isLoading || !seller) {
    return <TwoColumnPageSkeleton mainSections={3} sidebarSections={3} />;
  }

  if (isError) {
    throw error;
  }

  if (Children.count(children) > 0) {
    return (
      <TwoColumnPage data={seller} hasOutlet data-testid="store-detail-page">
        {children}
      </TwoColumnPage>
    );
  }

  return (
    <TwoColumnPage data={seller} hasOutlet data-testid="store-detail-page">
      <TwoColumnPage.Main>
        {seller.status === SellerStatus.PENDING_APPROVAL && (
          <StoreRequestSection seller={seller} />
        )}
        <StoreGeneralSection seller={seller} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "users" && <StoreMembersSection sellerId={seller.id} />}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <StoreConfigurationSection seller={seller} />
        <StoreAddressSection seller={seller} />
        <StoreCompanyDetailsSection seller={seller} />
        <StorePaymentDetailsSection seller={seller} />
        <StoreSubscriptionSection seller={seller} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const StoreDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: StoreGeneralSection,
  MainPaymentDetailsSection: StorePaymentDetailsSection,
  MainCompanyDetailsSection: StoreCompanyDetailsSection,
  SidebarConfigurationSection: StoreConfigurationSection,
  SidebarAddressSection: StoreAddressSection,
  SidebarSubscriptionSection: StoreSubscriptionSection,
  SidebarMembersSection: StoreMembersSection,
  Header: StoreDetailHeader,
  HeaderTitle: StoreDetailTitle,
  HeaderActions: StoreDetailActions,
  HeaderEditButton: StoreDetailEditButton,
});
