import { useLoaderData, useParams } from "react-router-dom";

import { CORE_LAYOUT_IDS } from "@mercurjs/dashboard-sdk";
import {
  LayoutComposer,
  detailPageDefaultEntries,
  useLinkQuery,
} from "@mercurjs/dashboard-shared";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { usePromotion, usePromotionRules } from "../../../hooks/api/promotions";
import { CampaignSection } from "./components/campaign-section";
import { PromotionConditionsSection } from "./components/promotion-conditions-section";
import { PromotionGeneralSection } from "./components/promotion-general-section";
import { PROMOTION_DETAIL_BASE_FIELDS, promotionLoader } from "./loader";

export const PromotionDetailPage = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof promotionLoader>
  >;

  const { id } = useParams();
  const linkQuery = useLinkQuery("promotion", PROMOTION_DETAIL_BASE_FIELDS);
  const { promotion, isLoading } = usePromotion(id!, linkQuery, {
    initialData,
  });
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
    <LayoutComposer
      widgetsZonePrefix="promotions.detail"
      preferredLayoutId={CORE_LAYOUT_IDS.TWO_COLUMN}
      data={promotion}
      data-testid="promotion-detail-page"
      sections={{
        main: (
          <>
            <LayoutComposer.Entry id="PromotionGeneralSection">
              <PromotionGeneralSection promotion={promotion} />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PromotionConditionsSection">
              <PromotionConditionsSection
                rules={rules || []}
                ruleType={"rules"}
              />
            </LayoutComposer.Entry>
            <LayoutComposer.Entry id="PromotionTargetConditionsSection">
              <PromotionConditionsSection
                rules={targetRules || []}
                ruleType={"target-rules"}
                applicationMethodTargetType={
                  promotion.application_method?.target_type || "items"
                }
              />
            </LayoutComposer.Entry>
            {promotion.type === "buyget" && (
              <LayoutComposer.Entry id="PromotionBuyConditionsSection">
                <PromotionConditionsSection
                  rules={buyRules || []}
                  ruleType={"buy-rules"}
                  applicationMethodTargetType={"items"}
                />
              </LayoutComposer.Entry>
            )}
            {detailPageDefaultEntries(promotion, { metadata: false })}
          </>
        ),
        side: (
          <LayoutComposer.Entry id="CampaignSection">
            <CampaignSection campaign={promotion.campaign!} promotion={promotion} />
          </LayoutComposer.Entry>
        ),
      }}
    />
  );
};
