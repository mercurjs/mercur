import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "@components/common/skeleton";
import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import { LayoutComposer, useLinkQuery } from "@mercurjs/dashboard-shared";
import { usePromotion, usePromotionRules } from "@hooks/api/promotions";

import { CampaignSection } from "./_components/campaign-section";
import { PromotionConditionsSection } from "./_components/promotion-conditions-section";
import { PromotionGeneralSection } from "./_components/promotion-general-section";

import type { loader } from "./loader";

export const PromotionDetailPage = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const { id } = useParams();
  const linkQuery = useLinkQuery("promotion", "+status");
  const { promotion, isLoading } = usePromotion(id!, linkQuery, {
    initialData,
  });
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
    <LayoutComposer
      widgetsZonePrefix="promotions.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={promotion}
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PromotionGeneralSection">
              <PromotionGeneralSection promotion={promotion} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PromotionRulesConditionsSection">
              <PromotionConditionsSection rules={rules || []} ruleType="rules" />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PromotionTargetRulesConditionsSection">
              <PromotionConditionsSection
                rules={targetRules || []}
                ruleType="target-rules"
              />
            </LayoutComposer.Entry>
            {promotion.type === "buyget" && (
              <LayoutComposer.Entry id="PromotionBuyRulesConditionsSection">
                <PromotionConditionsSection
                  rules={buyRules || []}
                  ruleType="buy-rules"
                />
              </LayoutComposer.Entry>
            )}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="CampaignSection">
            <CampaignSection
              campaign={promotion.campaign!}
              promotion={promotion}
            />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
