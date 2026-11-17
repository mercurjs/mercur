import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  PermissionGuard,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";
import { useCampaign } from "@hooks/api/campaigns";

import { CampaignBudget } from "./_components/campaign-budget";
import { CampaignConfigurationSection } from "./_components/campaign-configuration-section";
import { CampaignGeneralSection } from "./_components/campaign-general-section";
import { CampaignPromotionSection } from "./_components/campaign-promotion-section";
import { CAMPAIGN_DETAIL_FIELDS } from "./constants";

import type { loader } from "./loader";

export const CampaignDetailPage = () => {
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
    <LayoutComposer
      widgetsZonePrefix="campaigns.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={campaign}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="CampaignGeneralSection">
              <CampaignGeneralSection campaign={campaign} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CampaignPromotionSection">
              <PermissionGuard permission="promotions:view">
                <CampaignPromotionSection campaign={campaign} />
              </PermissionGuard>
            </LayoutComposer.Entry>
          </>
        ),
        side: (
          <>
            <LayoutComposer.Entry id="CampaignConfigurationSection">
              <CampaignConfigurationSection campaign={campaign} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="CampaignBudget">
              <CampaignBudget campaign={campaign} />
            </LayoutComposer.Entry>
          </>
        ),
      }}
    />
  );
};
