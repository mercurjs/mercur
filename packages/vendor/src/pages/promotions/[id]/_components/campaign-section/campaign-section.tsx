import { ArrowUpRightOnBox, PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, InlineTip, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"

import { ActionMenu } from "@components/common/action-menu"
import { DateRangeDisplay } from "@components/common/date-range-display"
import { NoRecords } from "@components/common/empty-table-content"

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
  campaign,
  promotion,
}: {
  campaign: HttpTypes.AdminCampaign | null
  promotion?: HttpTypes.AdminPromotion
}) => {
  const { t } = useTranslation()
  const { id } = useParams()

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
    <Container>
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("promotions.fields.campaign")}</Heading>

        <ActionMenu
          groups={[
            {
              actions,
            },
          ]}
        />
      </div>

      {campaign ? (
        <CampaignDetailSection campaign={campaign} warning={warning} />
      ) : (
        <NoRecords
          className="h-[180px] pt-4 text-center"
          title={t("promotions.campaignSection.noRecordsTitle")}
          message={t("promotions.campaignSection.noRecordsMessage")}
          action={{
            to: `/promotions/${id}/add-to-campaign`,
            label: t("promotions.campaignSection.addToCampaign"),
          }}
        />
      )}

      <DisplayExtensionZone model="promotion" zone="campaign" data={campaign} />
    </Container>
  )
}
