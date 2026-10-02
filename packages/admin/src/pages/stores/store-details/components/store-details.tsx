import { ReactNode, Children, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  WidgetZone,
  useLinkQuery,
  usePermissions,
  useWidgetTabs,
  type WidgetTab,
} from "@mercurjs/dashboard-shared";

import { TwoColumnPageSkeleton } from "../../../../components/common/skeleton";
import { TwoColumnPage } from "../../../../components/layout/pages";
import { useSeller } from "@/hooks/api";
import { SellerStatus } from "@mercurjs/types";

import { STORE_DETAIL_FIELDS } from "../loader";
import { StoreGeneralSection } from "./store-general-section";
import { StorePaymentDetailsSection } from "./store-payment-details-section";
import { StoreCompanyDetailsSection } from "./store-company-details-section";
import { StoreConfigurationSection } from "./store-configuration-section";
import { StoreAddressSection } from "./store-address-section";
import { StoreMembersSection } from "./store-members-section";
import { StoreRequestSection } from "./store-request-section";
import { StoreOrdersSection } from "./store-orders-section";
import { StoreOffersSection } from "./store-offers-section";
import {
  StoreDetailHeader,
  StoreDetailTitle,
  StoreDetailActions,
  StoreDetailEditButton,
} from "./store-detail-header";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

const TabBar = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab?: string;
  onTabChange: (tab: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t("stores.domain")}
      className="mt-1 flex flex-wrap items-center gap-x-2"
      data-testid="store-detail-tabs"
    >
      {tabs.map(({ id, label }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`store-detail-tab-panel-${id}`}
            id={`store-detail-tab-${id}`}
            data-testid={`store-detail-tab-${id}`}
            className={`txt-compact-small-plus rounded-full px-3 py-1.5 transition-colors ${
              isActive
                ? "border-ui-border-base bg-ui-bg-base shadow-borders-base text-ui-fg-base"
                : "text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [selectedTab, setActiveTab] = useState("orders");
  const { can } = usePermissions();
  const customTabs = useWidgetTabs("stores.detail.tabs");

  const query = useLinkQuery("seller", STORE_DETAIL_FIELDS);
  const { seller, isLoading, isError, error } = useSeller(id!, query);

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

  const toTab = ({ id, label, Component }: WidgetTab): Tab => ({
    id,
    label: t(label, { defaultValue: label }),
    content: <Component data={seller} />,
  });

  const tabs: Tab[] = [
    ...customTabs.before.map(toTab),
    ...(can("orders")
      ? [
          {
            id: "orders",
            label: t("orders.domain"),
            content: <StoreOrdersSection sellerId={seller.id} />,
          },
        ]
      : []),
    ...(can("offers")
      ? [
          {
            id: "offers",
            label: t("offers.domain"),
            content: <StoreOffersSection sellerId={seller.id} />,
          },
        ]
      : []),
    ...(can("members")
      ? [
          {
            id: "users",
            label: t("users.domain"),
            content: <StoreMembersSection sellerId={seller.id} />,
          },
        ]
      : []),
    {
      id: "timeOff",
      label: t("store.timeOff.header"),
      content: <StoreConfigurationSection seller={seller} />,
    },
    ...customTabs.after.map(toTab),
  ];
  const activeTab = tabs.find((tab) => tab.id === selectedTab) ?? tabs[0];

  return (
    <TwoColumnPage data={seller} hasOutlet data-testid="store-detail-page">
      <TwoColumnPage.Main>
        <WidgetZone id="stores.detail.main" data={seller}>
        {seller.status === SellerStatus.PENDING_APPROVAL &&
          !seller.approved_at &&
          !seller.rejected_at && (
            <StoreRequestSection seller={seller} />
          )}
        <StoreGeneralSection seller={seller} />
        <TabBar tabs={tabs} activeTab={activeTab.id} onTabChange={setActiveTab} />
        <div
          key={activeTab.id}
          role="tabpanel"
          id={`store-detail-tab-panel-${activeTab.id}`}
          aria-labelledby={`store-detail-tab-${activeTab.id}`}
        >
          {activeTab.content}
        </div>
        </WidgetZone>
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <WidgetZone id="stores.detail.side" data={seller}>
          <StoreAddressSection seller={seller} />
          <StoreCompanyDetailsSection seller={seller} />
          <StorePaymentDetailsSection seller={seller} />
        </WidgetZone>
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};

export const StoreDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: StoreGeneralSection,
  MainConfigurationSection: StoreConfigurationSection,
  MainPaymentDetailsSection: StorePaymentDetailsSection,
  MainCompanyDetailsSection: StoreCompanyDetailsSection,
  SidebarAddressSection: StoreAddressSection,
  SidebarMembersSection: StoreMembersSection,
  Header: StoreDetailHeader,
  HeaderTitle: StoreDetailTitle,
  HeaderActions: StoreDetailActions,
  HeaderEditButton: StoreDetailEditButton,
});
