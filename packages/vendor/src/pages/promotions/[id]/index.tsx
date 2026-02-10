// Route: /promotions/:id
import { HttpTypes } from "@medusajs/types"
import { UIMatch, useLoaderData, useParams, LoaderFunctionArgs } from "react-router-dom"

import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { useDashboardExtension } from "@/extensions"
import { usePromotion, usePromotionRules } from "@hooks/api/promotions"
import { promotionsQueryKeys } from "@hooks/api/promotions"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"

import { CampaignSection } from "./_components/campaign-section"
import { PromotionConditionsSection } from "./_components/promotion-conditions-section"
import { PromotionGeneralSection } from "./_components/promotion-general-section"

// Loader
const promotionDetailQuery = (id: string) => ({
  queryKey: promotionsQueryKeys.detail(id),
  queryFn: async () => fetchQuery(`/vendor/promotions/${id}`, { method: "GET", query: { fields: "+status" } }),
})

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  return queryClient.ensureQueryData(promotionDetailQuery(id!))
}

// Breadcrumb
type PromotionDetailBreadcrumbProps = UIMatch<HttpTypes.AdminPromotionResponse>

export const Breadcrumb = (props: PromotionDetailBreadcrumbProps) => {
  const { id } = props.params || {}
  const { promotion } = usePromotion(id!, { initialData: props.data, enabled: Boolean(id) })
  if (!promotion) return null
  return <span>{promotion.code}</span>
}

// Main component
export const Component = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof loader>>
  const { id } = useParams()
  const { promotion, isLoading } = usePromotion(id!, { initialData })
  const query: Record<string, string> = {}
  if (promotion?.type === "buyget") query.promotion_type = promotion.type

  const { rules } = usePromotionRules(id!, "rules", query)
  const { rules: targetRules } = usePromotionRules(id!, "target-rules", query)
  const { rules: buyRules } = usePromotionRules(id!, "buy-rules", query)
  const { getWidgets } = useDashboardExtension()

  if (isLoading || !promotion) return <TwoColumnPageSkeleton mainSections={3} sidebarSections={1} showJSON />

  return (
    <TwoColumnPage
      data={promotion}
      widgets={{
        after: getWidgets("promotion.details.after"),
        before: getWidgets("promotion.details.before"),
        sideAfter: getWidgets("promotion.details.side.after"),
        sideBefore: getWidgets("promotion.details.side.before"),
      }}
      hasOutlet
    >
      <TwoColumnPage.Main>
        <PromotionGeneralSection promotion={promotion} />
        <PromotionConditionsSection rules={rules || []} ruleType="rules" />
        <PromotionConditionsSection rules={targetRules || []} ruleType="target-rules" />
        {promotion.type === "buyget" && <PromotionConditionsSection rules={buyRules || []} ruleType="buy-rules" />}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <CampaignSection campaign={promotion.campaign!} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}
