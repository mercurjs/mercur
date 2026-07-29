import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { WidgetZone, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useCampaign } from "@hooks/api/campaigns";

import { CampaignBudget } from "./_components/campaign-budget";
import { CampaignConfigurationSection } from "./_components/campaign-configuration-section";
import { CampaignGeneralSection } from "./_components/campaign-general-section";
import { CampaignPromotionSection } from "./_components/campaign-promotion-section";
import { CAMPAIGN_DETAIL_FIELDS } from "./constants";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const linkQuery = useLinkQuery("campaign", CAMPAIGN_DETAIL_FIELDS);
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    { ...linkQuery },
    {
      placeholderData: initialData,
    },
  );

  if (isLoading || !campaign) {
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
        <TwoColumnPage hasOutlet data={campaign}>
          <TwoColumnPage.Main>
            <WidgetZone id="campaigns.detail.main" data={campaign}>
              <CampaignGeneralSection campaign={campaign} />
              <CampaignPromotionSection campaign={campaign} />
            </WidgetZone>
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <WidgetZone id="campaigns.detail.side" data={campaign}>
              <CampaignConfigurationSection campaign={campaign} />
              <CampaignBudget campaign={campaign} />
            </WidgetZone>
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const CampaignDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: CampaignGeneralSection,
  MainPromotionSection: CampaignPromotionSection,
  SidebarConfigurationSection: CampaignConfigurationSection,
  SidebarBudget: CampaignBudget,
});
