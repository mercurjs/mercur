// Route: /promotions/:id/add-to-campaign
import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { RouteDrawer } from "@components/modals"
import { useCampaigns } from "@hooks/api/campaigns"
import { usePromotion } from "@hooks/api/promotions"
import { AddCampaignPromotionForm } from "./add-campaign-promotion-form"

export const Component = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const { promotion, isPending, isError, error } = usePromotion(id!)

  const canViewCampaigns = useCan("campaigns")

  let campaignQuery = {}
  if (promotion?.application_method?.currency_code) {
    campaignQuery = { budget: { currency_code: promotion?.application_method?.currency_code } }
  }

  const { campaigns, isPending: areCampaignsLoading, isError: isCampaignError, error: campaignError } = useCampaigns(campaignQuery, { enabled: canViewCampaigns })

  const isNoAccess = !canViewCampaigns || isForbidden(campaignError)

  if (isError) throw error
  if (isCampaignError && !isNoAccess) throw campaignError

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("promotions.campaign.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {isNoAccess && <SectionNoAccess />}
      {!isNoAccess && !isPending && !areCampaignsLoading && promotion && campaigns && (
        <AddCampaignPromotionForm promotion={promotion} campaigns={campaigns} />
      )}
    </RouteDrawer>
  )
}
