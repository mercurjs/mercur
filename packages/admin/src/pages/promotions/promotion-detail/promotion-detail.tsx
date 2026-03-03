import { Children, ReactNode } from "react";
import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { usePromotion, usePromotionRules } from "../../../hooks/api/promotions";
import { CampaignSection } from "./components/campaign-section";
import { PromotionConditionsSection } from "./components/promotion-conditions-section";
import { PromotionGeneralSection } from "./components/promotion-general-section";
import { promotionLoader } from "./loader";

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof promotionLoader>
  >;

  const { id } = useParams();
  const { promotion, isLoading } = usePromotion(id!, { initialData });
  const query: Record<string, string> = {};

  if (promotion?.type === "buyget") {
    query.promotion_type = promotion.type;
  }

  const { rules } = usePromotionRules(id!, "rules", query);
  const { rules: targetRules } = usePromotionRules(id!, "target-rules", query);
  const { rules: buyRules } = usePromotionRules(id!, "buy-rules", query);

  if (isLoading || !promotion) {
    return (
      <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} showJSON />
    );
  }

  return (
    <>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <TwoColumnPage data={promotion} hasOutlet showJSON>
          <TwoColumnPage.Main>
            <PromotionGeneralSection promotion={promotion} />
            <PromotionConditionsSection
              rules={rules || []}
              ruleType={"rules"}
            />
            <PromotionConditionsSection
              rules={targetRules || []}
              ruleType={"target-rules"}
              applicationMethodTargetType={
                promotion.application_method?.target_type || "items"
              }
            />
            {promotion.type === "buyget" && (
              <PromotionConditionsSection
                rules={buyRules || []}
                ruleType={"buy-rules"}
                applicationMethodTargetType={"items"}
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

export const PromotionDetail = Object.assign(Root, {
  Main: TwoColumnPage.Main,
  Sidebar: TwoColumnPage.Sidebar,
  MainGeneralSection: PromotionGeneralSection,
  MainConditionsSection: PromotionConditionsSection,
  SidebarCampaignSection: CampaignSection,
});
