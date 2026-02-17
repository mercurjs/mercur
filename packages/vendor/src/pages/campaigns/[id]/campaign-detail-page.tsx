import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { useCampaign } from "@hooks/api/campaigns";
import { usePromotionTableQuery } from "@hooks/table/query/use-promotion-table-query";

import { CampaignBudget } from "./_components/campaign-budget";
import { CampaignConfigurationSection } from "./_components/campaign-configuration-section";
import { CampaignGeneralSection } from "./_components/campaign-general-section";
import { CampaignPromotionSection } from "./_components/campaign-promotion-section";
import { CampaignSpend } from "./_components/campaign-spend";
import { CAMPAIGN_DETAIL_FIELDS } from "./constants";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { searchParams } = usePromotionTableQuery({});
  const { campaign, isLoading, isError, error } = useCampaign(
    id!,
    { ...searchParams, fields: CAMPAIGN_DETAIL_FIELDS },
    {
      placeholderData: initialData,
    },
  );

  if (isLoading || !campaign) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={3} />;
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
            <CampaignGeneralSection campaign={campaign} />
            <CampaignPromotionSection campaign={campaign} />
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <CampaignConfigurationSection campaign={campaign} />
            <CampaignSpend campaign={campaign} />
            <CampaignBudget campaign={campaign} />
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
  SidebarSpend: CampaignSpend,
  SidebarBudget: CampaignBudget,
});
