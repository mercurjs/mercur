import { ArrowUpRightOnBox, PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { DateRangeDisplay } from "../../../../../components/common/date-range-display"
import { NoRecords } from "../../../../../components/common/empty-table-content"

const CampaignDetailSection = ({
  campaign,
}: {
  campaign: HttpTypes.AdminCampaign
}) => {
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
    </div>
  )
}

export const CampaignSection = ({
  campaign,
}: {
  campaign: HttpTypes.AdminCampaign | null
}) => {
  const { t } = useTranslation()
  const { id } = useParams()

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
          <CampaignDetailSection campaign={campaign} />
        </div>
      ) : (
        <div data-testid="promotion-campaign-section-no-records">
          <NoRecords
            className="h-[180px] pt-4 text-center"
            title="Not part of a campaign"
            message="Add this promotion to an existing campaign"
            action={{
              to: `/promotions/${id}/add-to-campaign`,
              label: "Add to Campaign",
            }}
            buttonVariant="transparentIconLeft"
            dataTestId="promotion-campaign-section-add-to-campaign-button"
          />
        </div>
      )}
    </Container>
  )
}
