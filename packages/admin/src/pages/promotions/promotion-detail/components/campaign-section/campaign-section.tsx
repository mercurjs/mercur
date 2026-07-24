import { ArrowUpRightOnBox, PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, InlineTip, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { DisplayExtensionZone, useLinkQuery } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { DateRangeDisplay } from "../../../../../components/common/date-range-display"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { usePromotion } from "../../../../../hooks/api/promotions"
import { PROMOTION_DETAIL_BASE_FIELDS } from "../../loader"

const CampaignDetailSection = ({
  campaign,
  warning,
}: {
  campaign: HttpTypes.AdminCampaign
  warning?: string
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-y-3">
      <div className="text-ui-fg-muted flex items-center gap-x-1.5">
        <Text size="small" weight="plus" className="text-ui-fg-base">
          {campaign.name}
        </Text>
        <Text size="small" weight="plus">
          ·
        </Text>
        <Text size="small" weight="plus">
          {campaign.campaign_identifier}
        </Text>
      </div>
      <DateRangeDisplay
        startsAt={campaign.starts_at}
        endsAt={campaign.ends_at}
        showTime
      />
      {warning && (
        <InlineTip variant="warning" label={t("general.warning")}>
          {warning}
        </InlineTip>
      )}
    </div>
  )
}

export const CampaignSection = ({
  campaign: campaignProp,
  promotion: promotionProp,
}: {
  campaign?: HttpTypes.AdminCampaign | null
  promotion?: HttpTypes.AdminPromotion
}) => {
  const { t } = useTranslation()
  const { id } = useParams()
  const linkQuery = useLinkQuery("promotion", PROMOTION_DETAIL_BASE_FIELDS)
  const { promotion: fetchedPromotion } = usePromotion(id!, linkQuery, {
    enabled: campaignProp === undefined,
  })
  const promotion = promotionProp ?? fetchedPromotion
  const campaign = campaignProp !== undefined ? campaignProp : (promotion?.campaign ?? null)

  const warning =
    campaign && promotion?.status !== "active"
      ? t("promotions.campaignSection.warnings.promotionMustBeActive")
      : campaign?.ends_at
        ? t("promotions.campaignSection.warnings.promotionExpires")
        : undefined

  const actions = [
    {
      label: t("actions.edit"),
      to: "add-to-campaign",
      icon: <PencilSquare />,
    },
  ]

  if (campaign) {
    actions.unshift({
      label: t("promotions.campaign.actions.goToCampaign"),
      to: `/campaigns/${campaign.id}`,
      icon: <ArrowUpRightOnBox />,
    })
  }

  return (
    <Container data-testid="promotion-campaign-section-container">
      <div className="flex items-center justify-between" data-testid="promotion-campaign-section-header">
        <Heading level="h2" data-testid="promotion-campaign-section-heading">{t("promotions.fields.campaign")}</Heading>

        <ActionMenu
          groups={[
            {
              actions,
            },
          ]}
          data-testid="promotion-campaign-section-action-menu"
        />
      </div>

      {campaign ? (
        <div data-testid="promotion-campaign-section-detail">
          <CampaignDetailSection campaign={campaign} warning={warning} />
        </div>
      ) : (
        <div data-testid="promotion-campaign-section-no-records">
          <NoRecords
            className="h-[180px] pt-4 text-center"
            title={t("promotions.campaignSection.noRecordsTitle")}
            message={t("promotions.campaignSection.noRecordsMessage")}
            action={{
              to: `/promotions/${id}/add-to-campaign`,
              label: t("promotions.campaignSection.addToCampaign"),
            }}
            dataTestId="promotion-campaign-section-add-to-campaign-button"
          />
        </div>
      )}

      <DisplayExtensionZone model="promotion" zone="campaign" data={campaign} />
    </Container>
  )
}
