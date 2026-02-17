import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { TwoColumnPage } from "@components/layout/pages";
import { usePromotion, usePromotionRules } from "@hooks/api/promotions";

import { CampaignSection } from "./_components/campaign-section";
import { PromotionConditionsSection } from "./_components/promotion-conditions-section";
import { PromotionGeneralSection } from "./_components/promotion-general-section";

import type { loader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const { promotion, isLoading } = usePromotion(id!, { initialData });
  const query: Record<string, string> = {};
  if (promotion?.type === "buyget") query.promotion_type = promotion.type;

  const { rules } = usePromotionRules(id!, "rules", query);
  const { rules: targetRules } = usePromotionRules(id!, "target-rules", query);
  const { rules: buyRules } = usePromotionRules(id!, "buy-rules", query);

  if (isLoading || !promotion)
    return (
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} showJSON />
    );

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={promotion} hasOutlet>
          <TwoColumnPage.Main>
            <PromotionGeneralSection promotion={promotion} />
            <PromotionConditionsSection rules={rules || []} ruleType="rules" />
            <PromotionConditionsSection
              rules={targetRules || []}
              ruleType="target-rules"
            />
            {promotion.type === "buyget" && (
              <PromotionConditionsSection
                rules={buyRules || []}
                ruleType="buy-rules"
              />
            )}
          </TwoColumnPage.Main>
          <TwoColumnPage.Sidebar>
            <CampaignSection campaign={promotion.campaign!} />
          </TwoColumnPage.Sidebar>
        </TwoColumnPage>
      )}
    </>
  );
};

export const PromotionDetailPage = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PromotionGeneralSection,
  MainConditionsSection: PromotionConditionsSection,
  SidebarCampaignSection: CampaignSection,
});
